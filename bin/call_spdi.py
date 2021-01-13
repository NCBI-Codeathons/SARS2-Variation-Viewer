#!/opt/python-all/bin/python
import argparse
from collections import Counter
from functools import lru_cache
import json
import logging
import requests
from requests.exceptions import HTTPError
import sys

from retry import retry

BASE_URL = 'https://api.ncbi.nlm.nih.gov/variation/v0/spdi'
REF_ACC = 'NC_045512.2'


@retry(HTTPError, tries=10, delay=1, backoff=2, max_delay=5)
def _get_spdi_with_retry(start, reference_allele, variant_allele):
    url = f'{BASE_URL}/{REF_ACC}:{start}:{reference_allele}:{variant_allele}/contextual'
    logging.info(f'Request at {url}')
    r = requests.get(url)
    data = r.json()
    if 'error' in data:
        code = data["error"]["code"]
        message = data['error']['message']
        logging.error(f'Error for {url}: {code} : {message}')
        if code == 502:
            raise HTTPError("General failure, trying again")
        raise Exception('Data error .. not retrying')
    return r.json()['data']


# wrapper to speed up identical calls
@lru_cache(maxsize=None)
def get_spdi(start, reference_allele, variant_allele):
    try:
        return _get_spdi_with_retry(start, reference_allele, variant_allele)
    except Exception as e:
        logging.error(f'Failed to get keys. {e}')
    return {
        'seq_id': REF_ACC,
        'position': start,
        'deleted_sequence': reference_allele,
        'inserted_sequence': variant_allele
    }


def keys_for(spdi):
    position_key = (f'{spdi["seq_id"]}:'
                    f'{spdi["position"]}:'
                    f'{spdi["deleted_sequence"]}')

    allele_key = (f'{spdi["seq_id"]}:'
                  f'{spdi["position"]}:'
                  f'{spdi["deleted_sequence"]}:'
                  f'{spdi["inserted_sequence"]}')

    return position_key, allele_key


def count_attributes(list_of_attr):
    output = []
    counts = Counter(list_of_attr)
    for term, cnt in counts.most_common():
        output.append({'value': term, 'count': cnt})
    return output


def main():
    parser = argparse.ArgumentParser(
        description='Convert variant data into SPDI format, and collapse common variants.'
    )

    parser.add_argument('-o', '--output', help='Output file', default='alleles.json')
    parser.add_argument('-i', '--input', help='Files to process', required=True)
    parser.add_argument('-m', '--metadata', help='Metadata file', required=True)
    parser.add_argument('-c', '--count_cutoff', help='Must have at least this many observations', default=5, type=int)
    parser.add_argument('-l', '--logfile', help='Logfile name', default='call_spdi.log')

    args = parser.parse_args()

    logging.basicConfig(filename=args.logfile, level=logging.INFO)

    # read in metadata to add to output
    with open(args.metadata) as f:
        metadata = json.load(f)

    # input data for spdi calls
    with open(args.input) as f:
        variants = json.load(f)

    counter = 0
    total = len(variants)

    # Map metadata name to display name
    metadata_kv = {
        'host': 'Host',
        'collection_date': 'Collection Date',
        'location': 'Collection Location'
    }
    alleles = {}
    for var in variants:
        if counter % 100 == 0:
            print(f'Processing variant {counter}/{total}')
        counter += 1
        spdi = get_spdi(var["start"], var["reference"], var["alleles"])

        position_key, allele_key = keys_for(spdi)

        if position_key in alleles and allele_key in alleles[position_key]['alleles']:
            alleles[position_key]['alleles'][allele_key]['count'] += 1
        else:
            if position_key not in alleles:
                alleles[position_key] = {
                    'alleles': {},
                    'start': var['start'],
                    'stop': var['start'] + len(var['reference']),
                    'reference': var['reference']
                }
            logging.info(f'For {spdi}, allele_key: {allele_key}')
            alleles[position_key]['alleles'][allele_key] = {
                'spdi': spdi,
                'count': 1,
                'accessions': []
            }
            for metadata_values in metadata_kv.values():
                alleles[position_key]['alleles'][allele_key][metadata_values] = []

        alleles[position_key]['alleles'][allele_key]['accessions'].append(var["accession"])

        if var["accession"] in metadata:
            metadata_for_accession = metadata[var["accession"]]
            for key, value in metadata_kv.items():
                if key in metadata_for_accession:
                    alleles[position_key]['alleles'][allele_key][value].append(metadata_for_accession[key])

        # if counter > 100:
        #     break

    variants = []
    for position_key, alleles in alleles.items():
        logging.info(f'Process {position_key}: {alleles}')
        new_record = {
            'start': alleles['start'],
            'stop': alleles['stop'],
            'reference_sequence': alleles['reference'],
            'alleles': []
        }
        for spdi, spdi_data in alleles['alleles'].items():
            if spdi_data['count'] < args.count_cutoff:
                continue
            new_allele = {
                'allele': spdi_data['spdi']['inserted_sequence'],
                'count': spdi_data['count'],
                'spdi': spdi,
            }
            for key, value in metadata_kv.items():
                new_allele[value] = count_attributes(spdi_data[value])

            new_record['alleles'].append(new_allele)
        if new_record['alleles']:
            variants.append(new_record)

    out_json = {'variants': variants}

    # output finalized json
    with open(args.output, 'w') as f:
        json.dump(out_json, f)


if __name__ == '__main__':
    sys.exit(main())
