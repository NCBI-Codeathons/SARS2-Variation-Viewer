#!/opt/python-all/bin/python
import argparse
import json
import sys
import zipfile

import jsonlines

#from google.protobuf.json_format import ParseDict
#import yaml

# install at VM
# cd /panfs/pan1.be-md.ncbi.nlm.nih.gov/structure_ihp/cdd/cdart/python3.7env/bin
# ./pip install ncbi-datasets-pylib
import ncbi.datasets.v1alpha1.reports.virus_pb2 as virus_report_pb2


def virus_report_for(path_to_zipfile):
    '''
    Return an object representing the data report.
    path_to_zipfile: The relative path to the zipfile containing the virus data report
    
    old code below:
    with zipfile.ZipFile(path_to_zipfile, 'r') as zip:
        virus_report_as_dict = yaml.safe_load(zip.read('ncbi_dataset/data/data_report.yaml'))
    virus_report = virus_report_pb2.VirusReport()
    ParseDict(virus_report_as_dict, virus_report)
    return virus_report
    '''

    genomesArray = []
    with zipfile.ZipFile(path_to_zipfile, 'r') as zip:
        report_file_handle = zip.open('ncbi_dataset/data/data_report.jsonl')
        reader = jsonlines.Reader(report_file_handle )        
        for json_dict in reader.iter(type=dict, skip_invalid=True):
            # json_dict is a single report - all fields should be there.
            genomesArray.append(json_dict)
    virus_report = {"genomes": genomesArray}
    return virus_report
            
def _location_for(location):
    result = []
    if "geographicLocation" in location:
        result.append(location["geographicLocation"])
    if "geographicRegion" in location:
        result.append(location["geographicRegion"])
    return '/'.join(result)


def main():
    parser = argparse.ArgumentParser(
        description='Collect meta-data from virus data report.'
    )

    parser.add_argument('-i', '--input', help='The datasets zipfile', required=True)
    parser.add_argument('-o', '--output', help='Output file', default='metadata.json')

    args = parser.parse_args()

    print(f'Gather virus report from {args.input}, output to {args.output}')
    virus_report = virus_report_for(args.input)

    metadata = {}
    for g in virus_report["genomes"]:
        print(f'Process {g["accession"]}')
        virusName = g["virus"]["sciName"] if "virus" in g and "sciName" in g["virus"] else ""
        host = g["host"]["sciName"] if "host" in g and "sciName" in g["host"] else ""
        isolate = g["isolate"]["name"] if "isolate" in g and "name" in g["isolate"] else ""
        location = _location_for(g["location"]) if "location" in g else ""
        collection_date = g["isolate"]["collectionDate"] if "isolate" in g and "collectionDate" in g["isolate"] else ""
        metadata[g["accession"]] = {
                'virusName': virusName,
                'host': host,
                'isolate': isolate,
                'location': location,
                'collection_date': collection_date
            }

    with open(args.output, 'w') as f:
        json.dump(metadata, f)


if __name__ == '__main__':
    sys.exit(main())
