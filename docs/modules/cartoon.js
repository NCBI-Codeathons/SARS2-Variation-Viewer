export const CARTOON_ITEM_CLICKED = 'CARTOON_ITEM_CLICKED';
export const CSS_ITEM_SELECTED = 'cartoon__item--selected';

export const getColorByCnt = (cnt) => {
  const max = 100;
  const value = (cnt / max > 1) ? 1 : cnt / max;
  return 'rgb(255, ' + parseInt(255 - value * 255) + ', ' + parseInt(255 - value * 255) + ')';
}

export class Cartoon {

  constructor({data, containerId = '#cartoon'} = {}) {
    this.data = data;
    this.container = d3.select(containerId);
    this.initCartoon();

    $('rect').each(function (i, elem) {
      const $this = $(this);
      const content = $this.attr('data-tooltip');
      if (content) {
        $this.popover({
          content: $this.attr('data-tooltip'),
          trigger: 'hover',
          html: true,
          placement: 'top'
        })
      }
    });
  }

  initCartoon() {
    this.setStyles();
    this.runD3();
  }

  setStyles() {
    this.container.style('display', 'block');
    this.styles = {
      width: this.container.style('width').replace(/px/, '') - 50,
      height: 100,
      boxHeight: 40,
      padding: 25, // old gap between genes
      segmPadding: 25, // old is 28
      genePadding: 20,
      peptPadding: 24,
      svgPadding: 50,
      scaleXSVG: undefined,
      scaleYSVG: undefined,
      trans: d3.transition().duration(400).ease(d3.easeLinear)
    };
  }

  runD3() {
    this.dataset = [];
    const cls = this;

    // convert dataset to an array as D3 select works with array
    this.dataset = ([this.data]);

    // set count of genes for deciding to show peptides or not
    cls.countOfGenes = +cls.dataset[0].gene_count;

    cls.styles.height = this.getSvgHeight(cls.styles.height, this.dataset[0]['_id']);

    const svg = this.container.selectAll('svg')
      .data(this.dataset)
      .enter()
      .append('svg');

    cls.svg = svg;
    cls.drawSvg(this.dataset, svg);
  }

  drawSvg(dataset, svg) {
    let start, stop, arr = [];
    dataset[0].segments.forEach(function (value, i) {
      arr.push(value.range[0]);
      arr.push(value.range[1])
    });

    start = d3.min(arr);
    stop = d3.max(arr);

    this.styles.scaleXSVG = d3.scaleLinear()
      .domain([start, stop])
      .range([0, this.styles.width - 50]);

    const styles = this.styles;

    // set svg width and height
    svg
      .attr('width', styles.scaleXSVG(stop - start) * 1 + styles.svgPadding * 2)
      .attr('height', styles.height);

    // segments
    let g = svg.append('g').attr('transform', (d, i) => {
      return `translate(${styles.svgPadding},${styles.svgPadding})`;
    });

    let cls = this;

    // add variants here
    const variants = g
      .append('g')
      .selectAll('g')
      .data(d => {
        return d['variants']
      })
      .enter()
      .append('g')
      .attr('class', 'variant')
      .each(function (d, i) {
        cls.renderVariant.call(this, d, i, cls)
      })

    // this g.segment class is needed, otherwise D3 will skip first data item
    // see https://stackoverflow.com/questions/19182775/d3-data-skipping-the-first-row-of-data
    let segment = g
      .selectAll('g.segment')
      .data(d => d['segments'])
      .enter()
      .append('g')
      .attr('class', 'segment')
      .attr('data-taxid', dataset[0]['tax_id'])
      .attr('data-accession', dataset[0]['assembly_acc'])
      .attr('transform', (d, i) => `translate(0, ${(i * 150) + 20})`)
      .attr('id', (d, i) => `segment-${i}`)
      .each(function (d, i) {
        cls.selectItemById.call(this, cls);
        cls.renderSegment.call(this, d, i, cls);
      })

    // genes
    let genes = segment.selectAll('g.gene')
      .data(function (d) {
        return d['genes']
      })
      .enter()
      .append('g')
      .attr('class', 'gene')
      .attr('id', function (d, i) {
        let parent = d3.select(this).node().parentNode;
        return parent.getAttribute('id') + '-gene-' + i
      })
      .attr('transform', (d, i) => `translate(0, ${styles.boxHeight})`)
      .each(function (d, i) {
        cls.selectItemById.call(this, cls);
        cls.renderEachGene.call(this, d, i, cls);
      })
      .each(function (d, i) {
        // if the width of the label is larger than the box, then figure "stop" position
        // from the value instead.
        let selection = d3.select(this);
        let parentSelection = d3.select(this.parentNode),
          dataGenes = parentSelection.attr('data-genes');

        let scaleSegmentX = cls.getScaleSegmentX(parentSelection);

        let scale = function (value) {
          return styles.scaleXSVG(scaleSegmentX(value))
        };

        const rectSelection = selection.select('rect'),
          rectStart = rectSelection.attr('data-base-start') - 1,
          rectEnd = rectSelection.attr('data-base-end');

        let textSelection = selection.select('text'),
          textSvgBox = textSelection.node().getBBox();
        const dataStartEnd = `#${this.parentNode.id}-gene-${i}:${rectStart}:${rectEnd}`;
        if (scale(rectEnd) - scale(rectStart) < textSvgBox.width) {
          const newEnd = styles.scaleXSVG.invert(scaleSegmentX(scale(rectStart) + textSvgBox.width));
          const newDataStartEnd = `#${this.parentNode.id}-gene-${i}:${rectStart}:${newEnd}`;
          parentSelection.attr('data-genes', dataGenes.replace(dataStartEnd, newDataStartEnd));
        }
      });

    // fix gene collision if any
    segment.each(function (d, i) {
      cls.fixGeneCollision.call(this, d, i, cls);
    })
  }

  getScaleSegmentX(parentSelection) {
    return d3.scaleLinear()
      .domain([
        parentSelection.datum().range[0],
        parentSelection.datum().range[1]
      ])
      .range([0, parentSelection.datum().range[1] - parentSelection.datum().range[0]]);
  }

  runD3Redraw() {
    this.styles.width = this.container.style('width').replace(/px/, '') - 50;
    this.styles.trans = undefined;

    this.svg.selectAll("*").remove();
    this.drawSvg(this.dataset, this.svg);
  }

  handleResize() {
    this.runD3Redraw()
  }

  renderSegment(d, i, cls) {
    const selection = d3.select(this);
    const styles = cls.styles;
    selection
      .append('rect')
      .classed('segment-box', true)
      .attr('width', function (d) {
        return styles.scaleXSVG(d.range[1] - d.range[0])
      })
      .attr('height', styles.boxHeight - styles.segmPadding)
      .attr('data-base-start', function (d) {
        return d.range[0]
      })
      .attr('data-base-end', function (d) {
        return d.range[1]
      })
      .attr('data-ga-action', 'virus-segment-click')
      .attr('data-ga-label', 'viral-genome')
    // .on('mouseover', function (data) {
    //   cls.mouseOver.call(this, data, cls);
    // })
    // .on('mousemove', function (data) {
    //   cls.mouseMove.call(this, data, cls);
    // })
    // .on('mouseout', function (data) {
    //   cls.mouseOut.call(this, data, cls);
    // })
    // .on('click', function (d, i, node) {
    //   cls.mouseClicked.call(this, d, i, cls, 'segment');
    // });

    selection.append('text')
      .text('5\'')
      .classed('segment-label', true)
      .attr('text-anchor', 'end')
      .attr('x', -10)
      .attr('y', (styles.boxHeight - styles.segmPadding));


    selection.append('text')
      .text('3\'')
      .classed('segment-label', true)
      .attr('x', styles.scaleXSVG(d.range[1] - d.range[0]) + 10)
      .attr('y', (styles.boxHeight - styles.segmPadding))
      .attr('text-anchor', 'start')


  }

  renderEachGene(d, i, cls) {
    const styles = cls.styles;
    const selection = d3.select(this);
    const parentSegmentSelection = d3.select(selection.node().parentNode);

    // compute scale relative to segment
    const scaleSegmentX = cls.getScaleSegmentX(parentSegmentSelection);

    const scale = function (value) {
      return styles.scaleXSVG(scaleSegmentX(value))
    };

    // some gene has multiple pairs of start-stop
    const bases = typeof d.location.bases[0] === 'number' ? [d.location.bases] : d.location.bases;

    let drawLine = false;

    for (let j = 0; j < bases.length; j++) {
      selection.append('rect')
        .attr('height', styles.boxHeight - styles.genePadding)
        .classed('gene-box', true)

        // .attr('stroke', '#5b616b')
        .attr('width', function (d) {
          let w = bases[j][1] - bases[j][0];
          return scale(w)
        })
        .attr('data-width', function (d) {
          let w = bases[j][0] + (bases[j][1] - bases[j][0]);
          return scale(w)
        })
        .attr('x', function (d) {
          return scale(bases[j][0])
        })
        .attr('data-protein', d.label)
        .attr('data-base-start', bases[0][0] + 1)
        .attr('data-base-end', bases[bases.length - 1][1])
        .attr('data-ga-action', 'virus-segment-click')
        .attr('data-ga-label', 'cds')
      // .on('mouseover', function (data) {
      //   cls.mouseOver.call(this, data, cls);
      // })
      // .on('mousemove', function (data) {
      //   cls.mouseMove.call(this, data, cls);
      // })
      // .on('mouseout', function (data) {
      //   cls.mouseOut.call(this, data, cls);
      // })
      // .on('click', function (d, i, node) {
      //   cls.mouseClicked.call(this, d, i, cls, 'gene');
      // });

      selection.append('text')
        .classed('gene-label', true)
        .text(d => d.label)
        .attr('x', function (d) {
          return scale(bases[j][0])
        })
        .attr('y', -5); // not needed

      // Each gene tells the parent where it is, so that the parent can arrange them
      // to avoid collision/overlapping

      let dataGeneInParent = parentSegmentSelection.attr('data-genes') || '';
      dataGeneInParent = dataGeneInParent.length ? dataGeneInParent.split(';') : [];

      if (bases.length > 1) {
        /*
            ex:
            0: (2) [5376, 5591]
            1: (2) [7924, 7970]
            then:
            start=5376, stop=7970
         */
        if (j === 0) {
          dataGeneInParent.push('#' + selection.attr('id') + ':' + bases[j][0] + ':' + bases[bases.length - 1][1]);
        }
      } else {
        dataGeneInParent.push('#' + selection.attr('id') + ':' + bases[j][0] + ':' + bases[j][1]);
      }
      parentSegmentSelection.attr('data-genes', dataGeneInParent.join(';'));

      // if drawLine true
      //   then draw line from the current gene pointing to the previous one
      if (drawLine) {
        const x1 = bases[j - 1][1],
          x2 = bases[j][0];
        selection.append('rect')
          .attr('class', 'line')
          .attr('fill', '#ccc')
          .attr('height', 1)
          .attr('width', scale(x2 - x1))
          .attr('x', scale(x1))
          .attr('y', (styles.boxHeight - styles.genePadding) / 2)
      }
      drawLine = !drawLine;

    }

    // peptides in a gene
    if (d.label === 'ORF1ab' || d.label === 'ORF1a') {
      // ORF1ab and ORF1a have the same set of peptides with the same locations
      let peptideG = selection.selectAll('g.peptide')
        .data(function (d) {
          if (d.label === 'ORF1ab') {
            return d.peptides
          } else if (d.label === 'ORF1a') {
            // return d.peptides.slice(0, d.peptides.length - 16)
            return d.peptides
          }
          // return d.peptides
        })
        .enter()
        .append('g')
        .attr('id', function (d, i) {
          return this.parentElement.getAttribute('id') + '-peptide-' + i
        })
        .attr('data-base-start', function (d) {
          //TODO: Greg needs to fix this
          //http://mwebdev2.ncbi.nlm.nih.gov:9091/cartoon/api/assembly/GCF_000861085.1/
          //find peptide with label "label": "prime"
          return d.location.bases[0][0] || d.location.bases[0];
        })

        .attr('data-base-end', function (d) {
          return d.location.bases[0][1] || d.location.bases[1];
        })
        .each(function (d, i) {
          cls.selectItemById.call(this, cls);
          cls.renderPeptides(d, i, this, scale, cls)
        });

      // fix peptide collision if any
      selection.each(function (d, i) {
        // cls.fixPeptideCollision.call(this, d, i, cls);
      });
    }


  }

  renderPeptides(d, i, g, scale, cls) {
    const selection = d3.select(g);
    const styles = cls.styles;
    const parent = g,
      start = d.location.bases[0][0] || d.location.bases[0],
      stop = d.location.bases[0][1] || d.location.bases[1];

    selection
      .classed('peptide', true)
      .attr('transform', function (d) {
        // return 'translate(0,' + (i * boxHeight) + ')'
        // return 'translate(0,' + styles.boxHeight + ')'
      });

    selection.append('rect')
      .classed('peptide-box', true)
      .attr('height', styles.boxHeight - styles.genePadding)
      // .attr('height', styles.boxHeight - styles.peptPadding)
      .attr('x', function (d) {
        return scale(start)
      })
      .attr('y', 0)
      .attr('width', function (d) {
        return scale(stop - start)
      })
      .attr('data-ga-action', 'virus-segment-click')
      .attr('data-ga-label', 'mature-peptide')
      .attr('data-protein', d.label)
      .attr('data-tooltip', d.label)
      /*
      .style('fill', 'darkgrey')
      .style('stroke-width', 2)
      .style('stroke', 'lightgrey')

       */
      //
      .on('mouseover', function (data) {
        const selector = `rect.peptide-box[data-tooltip="${data.label}"]`;
        const otherPeptides = d3.selectAll(selector);
        if (!otherPeptides.empty()) {
          otherPeptides.classed('cartoon__item--mouseover', true)
        }
      })
      // .on('mousemove', function (data) {
      //   cls.mouseMove.call(this, data, cls);
      // })
      .on('mouseout', function (data) {
        // // cls.mouseOut.call(this, data, cls);
        // const otherPeptides = d3.select(`rect.peptide-box[data-tooltip="${data.label}"]`);
        // otherPeptides.style('fill', '#aeb0b5')
        const otherPeptides = d3.selectAll(`rect.peptide-box[data-tooltip="${data.label}"]`);
        if (!otherPeptides.empty()) {
          otherPeptides.classed('cartoon__item--mouseover', false)
        }
      })
    // .on('click', function (d, i, node) {
    //   cls.mouseClicked.call(this, d, i, cls, 'peptide');
    // });


    // get the parent Gene and add peptides and their locations
    let parentGene = d3.select(g.parentElement);
    let dataPeptides = parentGene.attr('data-peptides') || '';
    dataPeptides = dataPeptides.length ? dataPeptides.split(';') : [];
    dataPeptides.push('#' + selection.attr('id') + ':' + start + ':' + stop);
    parentGene.attr('data-peptides', dataPeptides.join(';'));

    // hide peptide label
    /*
    selection.append('text')
      .attr('class', 'peptide-label')
      .text(function (d) {
        return d.label
      })
      .attr('x', function (d) {
        return scale(start)
      })
      .attr('y', -5)
      */
  }

  renderVariant(d, i, cls) {
    const boxWidth = 10,
      boxHeight = 10,
      boxMargin = 10;
    const {start, stop} = d;
    const selection = d3.select(this);
    selection
      .selectAll('rect')
      .data(d => d.alleles)
      .enter()
      .append('rect')
      .classed('allele-box', true)
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('fill', d => {
        return getColorByCnt(d.count);
      })
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('x', (dd, i) => {
        return start + (i * (boxWidth + boxMargin))
      })
      .attr('data-tooltip', d => {
        const {allele, count} = d
        return `
          <div class="variant--tooltip">
            <div>Allele: ${allele}</div>
            <div>Count: ${count}</div>
          </div>
        `
      })
  }

  fixGeneCollision(d, i, cls) {
    // if there is no gene in the section
    if (!d.genes || !d.genes.length) {
      return
    }

    let selection = d3.select(this);
    let arrGenes = selection.attr('data-genes').split(';');
    cls.fixObjectCollisions(arrGenes)
  }

  fixPeptideCollision(d, i, cls) {
    // if there is no peptides in the Gene
    if (!d.peptides || !d.peptides.length) {
      return
    }
    let selection = d3.select(this);
    let arrPeptides = selection.attr('data-peptides').split(';');
    cls.fixObjectCollisions(arrPeptides)
  }

  fixObjectCollisions(arr) {
    // accept a string represent a list of object
    // ex: #segment-0-gene-0-peptide-0:94:436;#segment-0-gene-0-peptide-1:94:394;#segment-0-gene-0-peptide-2:436:934;
    // #segment-0-gene-0-peptide-3:436:709;#segment-0-gene-0-peptide-4:709:934;#segment-0-gene-0-peptide-5:934:2419;
    // #segment-0-gene-0-peptide-6:2419:3475;#segment-0-gene-0-peptide-7:3475:4129;#segment-0-gene-0-peptide-8:4129:4519;
    // #segment-0-gene-0-peptide-9:4519:6376;#segment-0-gene-0-peptide-10:6376:6757;#segment-0-gene-0-peptide-11:6757:6826;
    // #segment-0-gene-0-peptide-12:6826:7573;#segment-0-gene-0-peptide-13:7573:10270
    let styles = this.styles;
    let bins = [[]];
    for (let i = 0; i < arr.length; i++) {
      if (i === 0) {
        bins[0].push(arr[i]);
        continue
      }

      let binLen = bins.length;
      let isCollided = false;
      let collidedAt = 0;
      let nextIndex = 0;

      for (let j = 0; j < binLen; j++) {
        for (let jj = 0; jj < bins[j].length; jj++) {
          let currentNode = this.getPosition(arr[i]);
          let prevNode = this.getPosition(bins[j][jj]);

          isCollided = this.isInRange(currentNode.start, prevNode.start, prevNode.stop) || this.isInRange(currentNode.stop, prevNode.start, prevNode.stop);
          collidedAt = j;
          // console.info('c', currentNode, 'p', prevNode, 'cl', isCollided, 'j=', j, 'collidedAt=', collidedAt);
          if (!isCollided) {
            nextIndex = j
          } else {
            nextIndex = j;
            break
          }
        }
        if (isCollided) {
          nextIndex = collidedAt + 1;
          collidedAt = 0
        } else {
          break
        }
      }

      if (isCollided) {
        // console.log('i', i, 'collided=', isCollided, 'nextIndex=', nextIndex)
        isCollided = false
      }
      // console.info('nextIndex', nextIndex)
      bins[nextIndex] = bins[nextIndex] || [];
      bins[nextIndex].push(arr[i])
    }

    for (let ii = 0; ii < bins.length; ii++) {
      for (let jj = 0; jj < bins[ii].length; jj++) {
        let cItem = this.getPosition(bins[ii][jj]);
        let cSelect = undefined;
        if (styles.trans) {
          cSelect = d3.select(cItem.id).transition(styles.trans);
        } else {
          cSelect = d3.select(cItem.id);
        }

        cSelect.attr('transform', 'translate(0,' + (styles.boxHeight + (ii * styles.boxHeight)) + ')')
      }
    }
  }

  getPosition(posString) {
    let o = posString.split(':');
    return {
      'start': o[1],
      'stop': o[2],
      'id': o[0]
    }
  }

  isInRange(val, start, stop) {
    //TODO: fix this magic number, the value should be relative to the min/max(small-gene:large-gene)
    let padding = 300;
    val = +val;
    start = +start - padding;
    stop = +stop + padding;
    // return val >= start && val <= stop
    return val > start && val < stop
  }

  mouseOver(data, cls) {
    console.info('mouse over')
    // cls.highlight.call(this, data, true);
    // toggleLabelVisbility.call(this, data, true);
    // cls.createTooltip(data, this)
  }

  mouseOut(data, cls) {
    // cls.highlight.call(this, data, false);
    //toggleLabelVisbility.call(this, data, false)
  }

  mouseMove(data, cls) {
  }

  // mouseClicked(d, i, cls, itemType) {
  //   let selection = d3.select(this);
  //   if (selection.classed(CSS_ITEM_SELECTED)) {
  //     selection.classed(CSS_ITEM_SELECTED, false)
  //   } else {
  //     selection.classed(CSS_ITEM_SELECTED, true);
  //   }
  //   const eventData = {
  //     target: this,
  //     selection: selection,
  //     data: d,
  //     itemType: itemType,
  //     selected: selection.classed(CSS_ITEM_SELECTED)
  //   };
  //
  //   if (itemType === 'peptide') {
  //     const otherPeptides = d3.selectAll(`rect.peptide-box[data-tooltip="${d.label}"]`);
  //     if (!otherPeptides.empty()) {
  //       otherPeptides.classed(CSS_ITEM_SELECTED, selection.classed(CSS_ITEM_SELECTED))
  //     }
  //   }
  //
  //
  //   cls.emit(CARTOON_ITEM_CLICKED, eventData);
  // }


  // TODO: each object should have its own highlighter
  // replace this if-else...
  highlight(data, isHighlighted) {
    let selection = d3.select(this);
    if (isHighlighted) {
      selection
        .style('stroke', function (d) {
          return d3.rgb(selection.style('fill')).darker(1)
        })
        .style('stroke-width', 2)
    } else {
      selection.style('stroke-width', 0);

      if (this.classList.contains('peptide-box')) {
        selection.style('stroke-width', 2).style('stroke', 'lightgrey')
      }
    }
  }


  getSvgHeight(h, acc) {
    let height = h;
    let accessions = [
      {'id': 'GCF_000864105', 'height': 1200},  // currently suppressed (segmented)
      {'id': 'GCF_000851145', 'height': 1000},  // currently suppressed (segmented)
      {'id': 'GCF_000860505', 'height': 112},
      {'id': 'GCF_000861825', 'height': 150},  // currently suppressed (circular)
      {'id': 'GCF_000861845', 'height': 112},  // increase height if we show mature-pept
      {'id': 'GCF_000872025', 'height': 112},  // increase height if we show mature-pept
      {'id': 'GCF_000882815', 'height': 208},
      {'id': 'GCF_000862125', 'height': 208},
      {'id': 'GCF_000871845', 'height': 208},
      {'id': 'GCF_000866625', 'height': 208},
      {'id': 'GCF_000865065', 'height': 208},
      {'id': 'GCF_000861085', 'height': 220},
      {'id': 'GCF_000864765', 'height': 176},
      {'id': 'GCF_000848505', 'height': 144},
      {'id': 'GCF_000855585', 'height': 144},
      {'id': 'GCF_009858895', 'height': 200},  // SARS-CoV-2
      {'id': 'GCF_000901155', 'height': 180},
      {'id': 'GCF_002816195', 'height': 144},
      {'id': 'GCF_000864885', 'height': 240},
      {'id': 'GCF_000854845', 'height': 176},
      {'id': 'GCF_000861165', 'height': 240},

      {'id': 'GCF_000864225', 'height': 1580},  // currently suppressed (segmented)
      {'id': 'GCF_000864245', 'height': 1580},  // currently suppressed (segmented)
      {'id': 'GCF_000890155', 'height': 1580},  // currently suppressed (segmented)
      {'id': 'GCF_000907835', 'height': 1580},  // currently suppressed (segmented)
      {'id': 'GCF_000910335', 'height': 1580},  // currently suppressed (segmented)
      {'id': 'GCF_001343825', 'height': 1580},  // currently suppressed (segmented)
      {'id': 'GCF_004117615', 'height': 1580},  // currently suppressed (segmented)
    ];
    for (let i = 0; i < accessions.length; i++) {
      if (accessions[i]['id'] === acc) {
        height = accessions[i]['height'];
      }
    }
    return height;
  }

  //TODO: this should be private
  selectItemById(cls) {
    if (this.id === cls.itemToBeSelected) {
      this.classList.add('cartoon-item-selected');
    }
  }

  select = (selector, isSelected = true) => {
    const item = this.container.selectAll(selector);
    if (!item.empty()) {
      item.classed(CSS_ITEM_SELECTED, isSelected);
    } else {
      console.error(`Cannot select item ${selector} in the cartoon`);
    }

  }
}