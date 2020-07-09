#!/usr/bin/env python3
import argparse
import bisect
import io
import json
import logging
import sys
import zipfile

import fastaparser
from google.protobuf.json_format import ParseDict
import yaml

import ncbi.datasets.v1alpha1.reports.virus_pb2 as virus_report_pb2


def virus_report_for(path_to_zipfile):
    '''
    Return an object representing the data report.
    path_to_zipfile: The relative path to the zipfile containing the virus data report
    '''
    with zipfile.ZipFile(path_to_zipfile, 'r') as zip:
        virus_report_as_dict = yaml.safe_load(zip.read('ncbi_dataset/data/data_report.yaml'))
    virus_report = virus_report_pb2.VirusReport()
    ParseDict(virus_report_as_dict, virus_report)
    return virus_report

# See http://www.petercollingridge.co.uk/tutorials/bioinformatics/codon-table/
bases = "TCAG"
codons = [a + b + c for a in bases for b in bases for c in bases]
amino_acids = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
CODON_TABLE = dict(zip(codons, amino_acids))


def fasta_for(path_to_zipfile):
    '''
    Return fasta parser for RefSeq CDS.
    path_to_zipfile: The relative path to the zipfile containing the virus data report
    '''
    fasta = {}
    with zipfile.ZipFile(path_to_zipfile, 'r') as zip:
        with io.TextIOWrapper(zip.open('ncbi_dataset/data/cds.fna')) as fh:
            for seq in fastaparser.Reader(fh):
                fasta[seq.id] = seq.sequence_as_string()

    return fasta


def protein_for(protein_index, position):
    index = bisect.bisect_right(protein_index, (position,))
    # print(f'{position} - {index} / {len(protein_index)}')
    return protein_index[index][1]


def _add_protein(proteins, item):
    proteins[item.name] = {
        'cds_seq_id': item.nucleotide.seq_id,
        'genomic_offset': item.nucleotide.range[0].begin,
        'protein_begin': item.protein.range[0].begin,
        'protein_end': item.protein.range[0].end,
        'protein_acc': item.protein.accession_version
    }


def _calculate_protein(variant, protein_info):
    # 0 1 and 2 are the first codon.
    # start is 0 based.  +1 to make it 1 based.
    _protein_position = variant['start'] + 1 - protein_info['genomic_offset']
    protein_position = int(_protein_position / 3) + 1
    offset = _protein_position % 3
    protein_accession = protein_info['protein_acc']
    return protein_accession, protein_position, offset


def _calculate_protein_change(cds_sequence, variant, allele, protein_info):
    protein_accession, protein_position, offset = _calculate_protein(variant, protein_info)
    nt_codon_start_zero_base = variant['start'] - offset - protein_info['genomic_offset'] + 1
    if nt_codon_start_zero_base < 0:
        return '', '', '', ''
    # print(f'{nt_codon_start_zero_base} - {len(cds_sequence)}')
    ref_codon = cds_sequence[nt_codon_start_zero_base:nt_codon_start_zero_base+3]
    alt_codon = ref_codon[:offset] + allele['allele'] + ref_codon[offset+1:]
    ref_aa = CODON_TABLE[ref_codon]
    alt_aa = CODON_TABLE[alt_codon]
    return ref_codon, alt_codon, ref_aa, alt_aa


def main():
    parser = argparse.ArgumentParser(
        description='Add protein annotation to variant data.'
    )

    parser.add_argument('-i', '--input', help='The datasets zipfile', required=True)
    parser.add_argument('-v', '--variants', help='Aggregated variant records', required=True)
    parser.add_argument('-o', '--output', help='Output file', required=True)
    parser.add_argument('-r', '--refseq', help='Refseq Dataset Zipfile', required=True)
    parser.add_argument('-l', '--logfile', help='Logfile name', default='call_spdi.log')

    args = parser.parse_args()
    logging.basicConfig(filename=args.logfile, level=logging.INFO)

    refseq_virus_report = virus_report_for(args.refseq)
    refseq_cds_fasta = fasta_for(args.refseq)

    protein_index = []
    proteins = {}
    for gene in refseq_virus_report.genomes[0].annotation.genes:
        for cds in gene.cds:
            if cds.name == 'ORF1a polyprotein':
                continue
            if not cds.mature_peptide:
                protein_index.append((cds.nucleotide.range[0].end, cds.name))
                _add_protein(proteins, cds)
                continue

            for mature_peptide in cds.mature_peptide:
                protein_index.append((mature_peptide.nucleotide.range[0].end, mature_peptide.name))
                _add_protein(proteins, mature_peptide)

    with open(args.variants) as fh:
        variants = json.load(fh)

    counter = 0
    total = len(variants)
    for variant in variants['variants']:
        if counter % 100 == 0:
            print(f'Processing variant {counter}/{total}')
        counter += 1

        if len(variant['reference_sequence']) != 1:
            logging.error(f'Unable to process non SNP variants at this time. {variant}')
            continue

        if variant['start'] > protein_index[-1][0]:
            continue

        protein_name = protein_for(protein_index, variant['start']+1)
        protein_info = proteins[protein_name]
        cds_seq_id = proteins[protein_name]['cds_seq_id']
        protein_accession, protein_position, offset = _calculate_protein(
            variant, protein_info)

        variant['protein_name'] = protein_name
        variant['protein_accession'] = protein_accession
        variant['protein_position'] = protein_position
        variant['offset'] = offset

        for allele in variant['alleles']:
            if len(allele['allele']) != 1:
                logging.error(f'Unable to process non SNP variants at this time. {variant}')
                continue

            ref_codon, alt_codon, ref_aa, alt_aa = _calculate_protein_change(
                refseq_cds_fasta[cds_seq_id],
                variant, allele, protein_info)
            variant['codon'] = ref_codon
            variant['amino_acid'] = ref_aa
            allele['codon'] = alt_codon
            allele['amino_acid'] = alt_aa
            allele['protein_variant'] = f'{ref_aa}{protein_position}{alt_aa}'

            if ref_aa == alt_aa:
                allele['aa_type'] = 'synonymous'
            else:
                allele['aa_type'] = 'non_synonymous'


    with open(args.output, 'w') as fh_out:
        json.dump(variants, fh_out, indent=2)

if __name__ == '__main__':
    sys.exit(main())


