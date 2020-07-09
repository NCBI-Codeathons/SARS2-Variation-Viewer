#!/usr/bin/env python3
import argparse
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
    # with open(args.metadata) as f:
    #     meta = json.load(f)['accessions']
    # accessions = [x['accession'] for x in meta]

    # input data for spdi calls
    with open(args.input) as f:
        variants = json.load(f)

    alleles = {}
    # get the allele_count for all the input variants
    # for var in variants:
    #     try:
    #         allele_count[f'{var["accession"]}{var["alleles"]}{var["start"]}{var["stop"]}{var["reference"]}'] += 1
    #     except:
    #         allele_count[f'{var["accession"]}{var["alleles"]}{var["start"]}{var["stop"]}{var["reference"]}'] = 1

    counter = 0
    total = len(variants)
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

        # append meta-data ....
        alleles[position_key]['alleles'][allele_key]['accessions'].append(var["accession"])

        # etc.
        # count_key = f'{var["accession"]}{var["alleles"]}{var["start"]}{var["stop"]}{var["reference"]}'

        # if var['accession'] in accessions:
        #     ct = 0
        #     curr_acc = meta[0]['accession']
        #     while curr_acc != var['accession']:
        #         ct += 1
        #         curr_acc = meta[ct]['accession']
        #     curr_meta = meta[ct]['metadata']
        #     # TO-DO: concat the metadata with the spdi output here as same elements in the last so next line of code below works
        #     #spdis.append(output, curr_meta)
        #     output = {"accession": var['accession'], "spdi": output, "metadata": curr_meta, "count": allele_count[count_key] }
        #     spdis.append(output)
        # else:
        #     output = {"accession": var['accession'], "spdi": output, "metadata": {}, "count": allele_count[count_key]}
        #     spdis.append(output)

    variants = []

    with open('tmp.json', 'w') as fh:
        json.dump(alleles, fh)

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
            new_record['alleles'].append({
                'allele': spdi_data['spdi']['inserted_sequence'],
                'count': spdi_data['count'],
                'spdi': spdi
            })
        if new_record['alleles']:
            variants.append(new_record)

    out_json = {'variants': variants}

    # TO-DO: read in front-jason JSON, then inser the above out_json into it in correct spot


    # output finalized json
    with open(args.output, 'w') as f:
        json.dump(out_json, f)


if __name__ == '__main__':
    sys.exit(main())
