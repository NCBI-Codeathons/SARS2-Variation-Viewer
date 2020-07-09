#!/usr/bin/env bash
set -e

hash bwa 2>/dev/null || { echo >&2 "I require bwa but it's not installed.  Aborting. "; exit 1; }
hash samtools 2>/dev/null || { echo >&2 "I require samtools but it's not installed.  Aborting. "; exit 1; }
hash bcftools 2>/dev/null || { echo >&2 "I require bcftools but it's not installed.  Aborting. "; exit 1; }


GENOMIC_FASTA_FILE='data/ncbi_dataset/data/genomic.fna'
if [[ ! -e $GENOMIC_FASTA_FILE ]]
then
    mkdir -p bin/
    curl -o bin/datasets 'https://ftp.ncbi.nlm.nih.gov/pub/datasets/command-line/LATEST/linux-amd64/datasets'
    chmod +x bin/datasets
    mkdir -p data

    SARS2_DATA_ZIP=data/sars2_data.zip
    bin/datasets download virus genome tax-name sars2 --filename $SARS2_DATA_ZIP
    unzip $SARS2_DATA_ZIP -d data/
fi


GENOMIC_FASTA_SPLIT_DIR='data/genomic_fasta_split'
if [[ ! -e $GENOMIC_FASTA_SPLIT_DIR ]]
then
    mkdir -p $GENOMIC_FASTA_SPLIT_DIR
    csplit -z $GENOMIC_FASTA_FILE '/>/' '{*}' --prefix $GENOMIC_FASTA_SPLIT_DIR/xx > /dev/null
fi

REFERENCE_FASTA='data/reference/NC_045512.fasta'
if [[ ! -e $REFERENCE_FASTA ]]
then
    mkdir -p data/reference
    ref_file=$(grep '>NC_045512.2' data/genomic_fasta_split/xx* | cut -f 1 -d\:)
    mv -v $ref_file ${REFERENCE_FASTA}
    bwa index ${REFERENCE_FASTA}
fi

CALLS_DIR=data/calls2
if [[ ! -e ${CALLS_DIR} ]]
then
    mkdir -p ${CALLS_DIR}
    echo "Iterate through files ..."
    TEMP_DIR=data/tmp
    rm -rf ${TEMP_DIR}
    for fasta_file in $(find ${GENOMIC_FASTA_SPLIT_DIR} -name "xx*"); do
        mkdir -p ${TEMP_DIR}
        accession=$(head -1 $fasta_file | cut -f 1 -d  ' ' | cut -b 2-)
        echo "Process $fasta_file ($accession)"

        INPUT_FASTA=${TEMP_DIR}/input.fasta
        OUTPUT_CALLS=${CALLS_DIR}/${accession}.vcf
        cp $fasta_file ${INPUT_FASTA}

        bwa mem ${REFERENCE_FASTA} ${INPUT_FASTA} >| ${INPUT_FASTA}.aligned.sam 2> /dev/null
        samtools view -S -b ${INPUT_FASTA}.aligned.sam >| ${INPUT_FASTA}.aligned.bam 2> /dev/null
        samtools sort -o ${INPUT_FASTA}.aligned.sorted.bam ${INPUT_FASTA}.aligned.bam 2> /dev/null
        samtools index ${INPUT_FASTA}.aligned.sorted.bam 2> /dev/null

        bcftools mpileup --threads 32 --max-idepth 8000 -f ${REFERENCE_FASTA} ${INPUT_FASTA}.aligned.sorted.bam 2>/dev/null \
          | bcftools call -mv -Oz - 2> /dev/null \
          |  zcat > ${OUTPUT_CALLS}
    done
fi

VIRTUAL_ENV_DIR=ve/
if [[ ! -e ${VIRTUAL_ENV_DIR} ]]
then
    echo "-> Create virtualenv"
    virtualenv -p python3 ${VIRTUAL_ENV_DIR}
    source ${VIRTUAL_ENV_DIR}/bin/activate
    pip install -r requirements.txt
fi

METADATA_JSON=data/metadata.json
if [[ ! -e ${METADATA_JSON} ]]
then
    echo "-> Collect metadata"
    ./bin/collect_metadata.py -i data/sars2_data.zip -o ${METDATA_JSON}
fi


VARIANTS_JSON=data/variants.json
if [[ ! -e ${VARIANTS_JSON} ]]
then
    echo "-> Aggregate variant calls"
    ./bin/calls_to_alleles.py -o data/pre_spdi.calls.json -i data/calls2/*vcf
    ./bin/call_spdi.py -i data/pre_spdi.calls.json -o ${VARIANTS_JSON} -m $METADATA_JSON
fi

FRONTEND_CARTOON=data/cartoon.json
if [[ ! -e ${FRONTEND_CARTOON} ]]
then
    echo "-> Create cartoon graphic"
    grep -v \> data/reference/NC_045512.fasta | tr -d '\n' > data/raw_reference_sequence.txt
    ./bin/produce_cartoon_data.py -i data/variants.json -t bin/template_cartoon.json -o ${FRONTEND_CARTOON} -r data/raw_reference_sequence.txt
fi

# TODO:
# 1. Add protein annotation (Brad)
# 2. 