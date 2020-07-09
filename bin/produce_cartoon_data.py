#!/usr/bin/env python3
import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(
        description='Consume SPDI json and produce javascript JSON cartoon data.'
    )

    parser.add_argument('-i', '--input', help='The datasets zipfile', required=True)
    parser.add_argument('-t', '--template', help='The template json data blob', required=True)
    parser.add_argument('-o', '--output', help='Output file', default='metadata.json')
    parser.add_argument('-r', '--raw_reference', help='Reference sequence', required=True)

    args = parser.parse_args()

    with open(args.raw_reference) as fh:
        raw_reference = fh.read()

    with open(args.template) as fh:
        template = json.load(fh)

    with open(args.input) as fh:
        variants = json.load(fh)

    template['variants'] = variants
    template['reference'] = raw_reference

    with open(args.output, 'w') as fh_out:
        fh_out.write('export const cartoonData = ')
        json.dump(template, fh_out, indent=2)

if __name__ == '__main__':
    sys.exit(main())
