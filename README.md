# Variation Analysis and Visualization of SARS-CoV-2 sequences in GenBank
NCBI Datasets Codeathon Team 4

The goal of this project is to identify and visualize variation (SNPs) in SARS-CoV-2 genomes

1. Download all SARS-CoV-2 genomes from GenBank using [NCBI Datasets](https://www.ncbi.nlm.nih.gov/datasets/)
2. Identify SNPs in these SARS-CoV-2 genomes
3. Correlate SNPs with SARS-CoV-2 genome metadata
4. Visualize SNPs and associated metadata in a graphical display

![workflow cartoon](github-readme-cartoon.jpg)

## Executing the workflow
The workflow depends on bwa, samtools and bcftools.  If those are not in `$PATH`, first execute:

```
bash bin/install_tool.sh
```

Next, run the workflow:

```
bash bin/workflow.sh
```

## Download SARS-CoV-2 genomes using NCBI Datasets
* Use the [NCBI Datasets command-line tool](https://www.ncbi.nlm.nih.gov/datasets/docs/command-line-virus/) to download all available SARS-CoV-2 genome sequences (6k+ as of July 8 2020) and associated metadata from GenBank 

## Identify SNPs in SARS-CoV-2 genomes
* Align 6k+ genomes using bwa mem
* Call variants (identify SNPs) using bcftools
* Encode variants using SPDI format [(Holmes et al., 2019)](https://www.ncbi.nlm.nih.gov/pubmed/31738401)

<img src="variant-counts-by-pos-spike.png" alt="variant counts by position" width="800"/>

## Correlate SNPs with SARS-CoV-2 genome metadata
* Extract metadata, e.g. geographic location, host isolate, etc. from the NCBI Datasets virus genome data report
* Join variant data to virus metadata

## Visualize SNPs in a graphical display
* Visualize SNPs and associated metadata in a graphical display using two views, summary view and detailed view
* Summary View: Visualize SNPs mapped to the SARS-CoV-2 reference genome with protein annotations
* Detailed View: Visualize SNPs mapped to SARS-CoV-2 proteins at single amino acid resolution, with links to [iCn3D](https://www.ncbi.nlm.nih.gov/Structure/icn3d/docs/icn3d_about.html) protein structure views 

<img src="summary-view.png" alt="variant counts by position" width="800"/>
<img src="detailed-view.png" alt="variant counts by position" width="800"/>

