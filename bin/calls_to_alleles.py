#!/usr/bin/env python3
import argparse
import json
import os
import sys


def process_record(line, accession):
    data = line.split()
    start = int(data[1])-1
    reference = data[3]
    return {
        'accession': accession,
        'alleles': data[4],
        'start': start,
        'stop': start+len(reference),
        'reference': reference
    }


def main():
    parser = argparse.ArgumentParser(
        description='Convert VCF calls into allele JSON structure'
    )

    parser.add_argument('-o', '--output', help='Output file', default='alleles.json')
    parser.add_argument('-i', '--input', nargs='+', help='Files to process', required=True)

    args = parser.parse_args()

    counter = 0
    records = []
    for file in args.input:
        accession = os.path.splitext(os.path.basename(file))[0]
        with open(file) as fh:
            for line in fh.readlines():
                if line.startswith('#'):
                    continue
                counter += 1
                records.append(process_record(line, accession))

    with open(args.output, 'w') as fh:
        json.dump(records, fh)


if __name__ == '__main__':
    sys.exit(main())
