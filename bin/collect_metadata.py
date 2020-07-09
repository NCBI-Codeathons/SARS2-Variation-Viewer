#!/usr/bin/env python3
import argparse
from datetime import datetime, timezone, timedelta
import json
import sys
import zipfile

import pandas as pd
from pyfaidx import Fasta
from google.protobuf.json_format import ParseDict
import yaml

import ncbi.datasets.v1alpha1.reports.virus_pb2 as virus_report_pb2
import ncbi.datasets


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


def main():
    parser = argparse.ArgumentParser(
        description='Collect meta-data from virus data report.'
    )

    parser.add_argument('-i', '--input', help='The datasets zipfile', required=True)
    parser.add_argument('-o', '--output', help='Output file', default='metadata.json')

    args = parser.parse_args()

    virus_report = virus_report_for(args.input)

    genome_data = []
    for g in virus_report.genomes:
        print(f'Process {g.accession}')
        genome_data.append({
            'accession': g.accession,
            'metadata': {
                'virusName': g.virus.sci_name,
                'host': g.host.sci_name,
                'isolate': g.isolate.name,
                'location': g.location.geographic_location,
            }
        })

    genome_data = {'accessions': genome_data}
    with open(args.output, 'w') as f:
        json.dump(genome_data, f)

if __name__ == '__main__':
    sys.exit(main())
