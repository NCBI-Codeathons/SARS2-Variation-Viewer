#!/usr/bin/env bash
set -e

message='''
You are missing one of the following tools: bwa, samtools, bcftools.

Please ensure these tools are on $PATH, or alternatively, run bin/install_tool.sh.

Quitting.
'''
for tool in bwa samtools bcftools
do
    hash $tool 2>/dev/null || { echo >&2 $message; exit 1; }
done

SARS2_DATA_ZIP=data/sars2_data.zip
SARS2_REFSEQ_DATA_ZIP=data/sars2_refseq_data.zip

GENOMIC_FASTA_FILE='data/ncbi_dataset/data/genomic.fna'
if [[ ! -e $GENOMIC_FASTA_FILE ]]
then
    mkdir -p bin/
    curl -o bin/datasets 'https://ftp.ncbi.nlm.nih.gov/pub/datasets/command-line/LATEST/linux-amd64/datasets'
    chmod +x bin/datasets
    mkdir -p data

    bin/datasets download virus genome tax-name sars2 --filename $SARS2_DATA_ZIP
    unzip $SARS2_DATA_ZIP -d data/

    bin/datasets download virus genome tax-name sars2 --refseq --filename $SARS2_REFSEQ_DATA_ZIP
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
    python3 -m venv ${VIRTUAL_ENV_DIR}
    source ${VIRTUAL_ENV_DIR}/bin/activate
    pip install -r requirements.txt
fi

METADATA_JSON=data/metadata.json
if [[ ! -e ${METADATA_JSON} ]]
then
    echo "-> Collect metadata"
    ./bin/collect_metadata.py -i ${SARS2_DATA_ZIP} -o ${METADATA_JSON}
fi


VARIANTS_JSON=data/variants.json
if [[ ! -e ${VARIANTS_JSON} ]]
then
    echo "-> Aggregate variant calls"
    ./bin/calls_to_alleles.py -o data/pre_spdi.calls.json -i data/calls2/*vcf
    ./bin/call_spdi.py -i data/pre_spdi.calls.json -o ${VARIANTS_JSON} -m $METADATA_JSON
fi

FINAL_DATA_FILE=docs/mock-data/protein_and_metadata.js
if [[ ! -e ${FINAL_DATA_FILE} ]]
then
    echo "-> Create data to support front-end: ${FINAL_DATA_FILE}"
    grep -v \> data/reference/NC_045512.fasta | tr -d '\n' > data/raw_reference_sequence.txt
    ./bin/annotate.py \
       -v ${VARIANTS_JSON} \
       -o data/annotated_variants.json \
       -i ${SARS2_DATA_ZIP} \
       -r ${SARS2_REFSEQ_DATA_ZIP}

    ./bin/produce_cartoon_data.py \
       -i data/annotated_variants.json \
       -t bin/template_cartoon.json \
       -o ${FINAL_DATA_FILE} \
       -r data/raw_reference_sequence.txt
else
    echo "${FINAL_DATA_FILE} already exists.  Not re-creating"
fi
