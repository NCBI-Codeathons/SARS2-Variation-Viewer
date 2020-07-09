import json
import requests
from functools import lru_cache

# wrapper to speed up identical calls
@lru_cache(maxsize=32)
def get_spdi(url):
    r = requests.get(url)
    data = r.json()
    z = {}
    try:
        output = data['data']
        return output
    except:
        pass

# read in metadata to add to output
with open('metadata.json') as f:
    meta = json.load(f)
meta = meta['accessions']
meta_accs = [x['accession'] for x in meta]

# input data for spdi calls
with open('input.json') as f:
    data = json.load(f)

variants = data['variants']

counts = {}
# get the counts for all the input variants
for var in variants:
    try:
        counts[f'{var["accession"]}{var["alleles"]}{var["start"]}{var["stop"]}{var["reference"]}'] += 1
    except:
        counts[f'{var["accession"]}{var["alleles"]}{var["start"]}{var["stop"]}{var["reference"]}'] = 1

base_url = 'https://api.ncbi.nlm.nih.gov/variation/v0/spdi/NC_045512.1:'
spdis = []
for var in variants:
    count_key = f'{var["accession"]}{var["alleles"]}{var["start"]}{var["stop"]}{var["reference"]}'
    spdi_str = f'{var["start"]}:{var["reference"]}:{var["alleles"]}/contextual'
    input_req = f'{base_url}{spdi_str}'
    output = get_spdi(input_req)
    if var['accession'] in meta_accs:
        ct = 0
        curr_acc = meta[0]['accession']
        while curr_acc != var['accession']:
            ct += 1
            curr_acc = meta[ct]['accession']
        curr_meta = meta[ct]['metadata']
        # TO-DO: concat the metadata with the spdi output here as same elements in the last so next line of code below works
        #spdis.append(output, curr_meta)
        output = {"accession": var['accession'], "spdi": output, "metadata": curr_meta, "count": counts[count_key] }
        spdis.append(output)
    else:
        output = {"accession": var['accession'], "spdi": output, "metadata": {}, "count": counts[count_key]}
        spdis.append(output)

out_json = {'variants': spdis}

# TO-DO: read in front-jason JSON, then inser the above out_json into it in correct spot


# output finalized json
with open('output.json', 'w') as f:
    json.dump(out_json, f)

