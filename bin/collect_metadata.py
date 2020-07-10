#!/usr/bin/env python3
import argparse
import json
import sys
import zipfile

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


def _location_for(location):
    result = []
    if location.geographic_location:
        result.append(location.geographic_location)
    if location.geographic_region:
        result.append(location.geographic_region)
    return '/'.join(result)


def main():
    parser = argparse.ArgumentParser(
        description='Collect meta-data from virus data report.'
    )

    parser.add_argument('-i', '--input', help='The datasets zipfile', required=True)
    parser.add_argument('-o', '--output', help='Output file', default='metadata.json')

    args = parser.parse_args()

    print(f'Gather virus report from {args.input}')
    virus_report = virus_report_for(args.input)

    metadata = {}
    for g in virus_report.genomes:
        print(f'Process {g.accession}')
        metadata[g.accession] = {
                'virusName': g.virus.sci_name,
                'host': g.host.sci_name,
                'isolate': g.isolate.name,
                'location': _location_for(g.location),
                'collection_date': g.isolate.collection_date
            }

    with open(args.output, 'w') as f:
        json.dump(metadata, f)


if __name__ == '__main__':
    sys.exit(main())
