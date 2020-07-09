import {cartoonData} from "../mock-data/data.js";
import {Cartoon} from "./modules/cartoon.js";
import {Table} from "./table.js";


$(document).ready(function () {
  const cartoon = new Cartoon({data: cartoonData});
  const table = new Table({data: cartoonData})
});

// details view
$(document).ready(function () {

  var dataStr = '{ "acc": "NC_045512.2", "gi": 1798174254, "range": [ 0, 29903], "variants": [ { "start": 5, "stop": 5, "reference_sequence": "A", "alleles": [ { "allele": "C", "count": 10 }, { "allele": "G", "count": 20 } ] }, { "start": 25, "stop": 25, "reference_sequence": "C", "alleles": [ { "allele": "A", "count": 40 }, { "allele": "T", "count": 80 } ] } ] }';
  var data = JSON.parse(dataStr);
  let html = '<div class="icn3d-dl_sequence">';
  html += '<span class="icn3d-seqLine">';
  var range0 = data.range[0], range1 = data.range[1];
  for (var i = range0; i < range1; ++i) {
    var c = 'A';
    var pos = i + 1;
    var color = '333333';
    html += '<span id="' + pos + '" title="' + c + pos + '" class="icn3d-residue" style="color:#' + color + '">' + c + '</span>';
  }
  html += '</span><br>';
  var snpData = data.variants;
  var posHash = {};
  for (var i = 0, il = snpData.length; i < il; ++i) {
    var pos = snpData[i].start;
    posHash[pos] = snpData[i].alleles;
  }
  var bHistogram = false;
  html += getSnpHtml(posHash, range0, range1, bHistogram);
  bHistogram = true;
  html += getSnpHtml(posHash, range0, range1, bHistogram);
  html += '</div>';
  $("#div0").html(html);

  const initTooltips = () => {
    const $allPoppers = $('[data-tippy-content]');
    $allPoppers.each(function (i, elem) {
      const $this = $(this);

      const content = $this.attr('data-tippy-content');
      if (content) {
        $this.popover({
          content: content,
          trigger: 'hover',
          html: true,
          placement: 'top',
          delay: {
            "show": 0,
            "hide": 2000
          }
        })
      }
    });
  }

  setTimeout(() => {
    initTooltips();
  }, 0);

  function getSnpHtml(posHash, range0, range1, bHistogram) {
    var snpHtml = '';
    var height = (bHistogram) ? 30 : 15;
    var url = 'https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmdbid=1TSR&command=color+grey;+select+.A:20;+color+red;+style+sidec+stick';
    snpHtml += '<span class="icn3d-seqLine" style="height: ' + height + 'px">';
    for (var i = range0; i < range1; ++i) {
      if (!posHash.hasOwnProperty(i)) {
        snpHtml += '<span class="icn3d-residue"> </span>';
      } else {
        for (var j = 0, jl = posHash[i].length; j < jl; ++j) {
          var alleleItem = posHash[i][j];
          var c = alleleItem.allele;
          var pos = i + 1;
          var color = getColorByCnt(alleleItem.count);
          var percent = getPercentByCnt(alleleItem.count);
          if (bHistogram) {
            snpHtml += '<span id="his_' + pos + '" class="icn3d-residue" style="background-color:#888"><div style="background-color:#888; height:'
              + height * percent + 'px">&nbsp;</div><div style="background-color:#FFF; height:'
              + height * (1 - percent) + 'px">&nbsp;</div></span>';
          } else {
            snpHtml += '<span id="seq_' + pos + '" data-tippy-content="Allele: ' + c + pos + ', Count: ' + alleleItem.count
              + ', <a href=\'' + url + '\' style=\'color:white\'>iCn3D</a>" class="icn3d-residue" style="background-color:' + color + '">' + c + '</span>';
          }
        }
      }
    }
    snpHtml += '</span><br>';
    return snpHtml;
  }

  function getPercentByCnt(cnt) {
    var max = 100;
    var value = (cnt / max > 1) ? 1 : cnt / max;
    return value;
  }

  function getColorByCnt(cnt) {
    var value = getPercentByCnt(cnt);
    return 'rgb(255, ' + parseInt(255 - value * 255) + ', ' + parseInt(255 - value * 255) + ')';
  }
}); // document ready
