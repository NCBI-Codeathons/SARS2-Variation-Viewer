import ncbi.datasets
import json
import os
import csv
import yaml
import zipfile
import pandas as pd
from pyfaidx import Fasta
from google.protobuf.json_format import ParseDict
import ncbi.datasets.v1alpha1.reports.virus_pb2 as virus_report_pb2
from collections import OrderedDict, Counter
from datetime import datetime, timezone, timedelta

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


# create an api instance to interact with viral genome downloads
virus_api = ncbi.datasets.VirusDownloadApi(ncbi.datasets.ApiClient())

## download all genome sequences from NCBI for SARS2
taxid = 2697049
viral_genomes = virus_api.get_virus_dataset_stream(taxid, refseq_only=True, _preload_content=False)
zipfn = 'ncbi_genomes.zip'
with open(zipfn, 'wb') as f:
    f.write(viral_genomes.data)

#os.system('./datasets download assembly tax-id 2697049 --filename viral_data.zip')
#os.system('unzip viral_data.zip')

virus_report = virus_report_for(zipfn)

genome_data = []
for g in virus_report.genomes:
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
with open('metadata.json', 'w') as f:
    json.dump(genome_data, f)
