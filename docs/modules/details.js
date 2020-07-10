export const detailsView = data => {

  function getPdbInfo(mapArray, acc_ver, resi) {
    var pdbinfo = {};
    var pos = acc_ver.indexOf('.');
    var acc = (pos == -1) ? acc_ver : acc_ver.substr(0, pos);

    for (var i = 0, il = mapArray.length; i < il; ++i) {
      var idArray = mapArray[i].split(' ');

      if (idArray.length != 5) console.log("Error in the mapping data");

      if (acc == idArray[0]) {
        var pdbid = idArray[1];
        var offset = parseInt(idArray[2]);
        var pdbResi = resi + offset;
        if (pdbResi >= parseInt(idArray[3]) && pdbResi <= parseInt(idArray[4])) {
          pdbinfo.pdbid = pdbid;
          pdbinfo.resi = pdbResi;
        }

        break;
      }
    }

    return pdbinfo;
  }

  function getSnpHtml(posHash, range0, range1, bHistogram) {
    var snpHtml = '';

    var height = (bHistogram) ? 30 : 15;

    snpHtml += '<span class="icn3d-seqLine">';
    for (var i = range0; i < range1; ++i) {
      if (!posHash.hasOwnProperty(i)) {
        snpHtml += '<span class="icn3d-residue"> </span>';
      } else {
        var url = '';

        var realResi, oriResn, proteinName;
        if (posHash[i].protein_accession) {
          var acc_ver = posHash[i].protein_accession;
          var resi = posHash[i].protein_position;
          proteinName = posHash[i].protein_name;

          var pdbinfo = getPdbInfo(mapArray, acc_ver, resi);
          oriResn = posHash[i].amino_acid;

          if (pdbinfo.pdbid !== undefined) {
            var pdbid = pdbinfo.pdbid;
            realResi = pdbinfo.resi;

            var pdb_chain = pdbid.split('_');


            url = 'https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmdbid=' + pdb_chain[0]
              + '&command=view+annotations;+set+annotation+cdd;+set+annotation+snp;+set+annotation+3ddomain;+set+annotation+site;+set+annotation+ssbond;+set+annotation+crosslink;+set+view+detailed+view;+select+chain+!' + pdb_chain[1]
              + ';+show+selection;+color+secondary+structure+green;+select+.' + pdb_chain[1]
              + ':' + realResi + ';+color+FFA500;+style+sidec+stick;+your+note+|+' + realResi + oriResn + '>';
          }
        }

        for (var j = 0, jl = posHash[i].alleles.length; j < jl; ++j) {
          var alleleItem = posHash[i].alleles[j];

          var c = alleleItem.allele;
          var pos = i + 1;
          var color = getColorByCnt(alleleItem.count);
          var percent = getPercentByCnt(alleleItem.count);

          if (bHistogram) {
            snpHtml += '<span id="his_' + pos + '" class="icn3d-residue" style="background-color:#888"><div class="icn3d-bar1" style="height:'
              + height * percent + 'px">&nbsp;</div><div class="icn3d-bar2" style="height:'
              + height * (1 - percent) + 'px">&nbsp;</div></span>';
          } else {
            snpHtml += '<span id="seq_' + pos + '" data-title="Allele: ' + c + pos + ', Count: ' + alleleItem.count;
            // only consider "non_synonymous"
            //var urlStr = (url && alleleItem.aa_type == 'non_synonymous') ? ', <a href=\'' + url + alleleItem.amino_acid + '\' target=\'_icn3d\'>Show in 3D</a>' : '';
            var urlStr = (url) ? ', Protein: ' + proteinName + ', <a href=\'' + url + alleleItem.amino_acid + ', Protein: ' + proteinName + '\' target=\'_icn3d\'>Show ' + realResi + oriResn + '>' + alleleItem.amino_acid + ' in 3D</a>' : '';
            snpHtml += urlStr + '" class="icn3d-residue" style="background-color:' + color + '">' + c + '</span>';
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

  var mapArray = [];
  // refseq acc, pdb chain, offset to get prd resi, start, end of pdb resi
  // no data for: YP_009725298, YP_009725300, YP_009725302, YP_009724394, YP_009725318, YP_009724396, YP_009725255, YP_009724393
  mapArray.push('YP_009725297 2GDT_A -11 2 116');
  mapArray.push('YP_009725299 6WUU_A -743 1 318');
  mapArray.push('YP_009725301 6XA4_A 2 4 307');
  mapArray.push('YP_009725303 7BV1_C 1 3 65');
  mapArray.push('YP_009725304 7BV1_B 1 79 192');
  mapArray.push('YP_009725305 6W9Q_A 20 21 133');
  mapArray.push('YP_009725306 6W4H_B 3 21 136');
  mapArray.push('YP_009725307 7C2K_A 2 3 931');
  mapArray.push('YP_009725308 6JYT_A 2 3 598');
  mapArray.push('YP_009725309 5C8S_B 0 1 525');
  mapArray.push('YP_009725310 6XDH_A 22 23 367');
  mapArray.push('YP_009725311 6W4H_A 3 4 301');
  mapArray.push('YP_009724391 6XDC_A 0 40 238');
  mapArray.push('YP_009724395 1XAK_A -13 2 69');
  mapArray.push('YP_009724390 7C2L_A 0 14 1146');
  mapArray.push('YP_009724392 5X29_A 16 24 81');
  mapArray.push('YP_009724397 6YI3_A -40 3 140');

  var snpData = data.variants;
  var range0 = data.segments[0].range[0], range1 = data.segments[0].range[1];

  let html = '<div class="icn3d-dl_sequence">';

  var posHash = {};
  for (var i = 0, il = snpData.length; i < il; ++i) {
    var pos = snpData[i].start;
    posHash[pos] = snpData[i];
  }

  var bHistogram;
  //bHistogram = true;
  //html += getSnpHtml(posHash, range0, range1, bHistogram);
  bHistogram = false;
  html += getSnpHtml(posHash, range0, range1, bHistogram);

  html += '<span class="icn3d-seqLine">';
  for (var i = range0; i < range1; ++i) {
    var c = data.reference[i];
    var pos = i + 1;
    var color = '333333';

    html += '<span id="' + pos + '" data-title="' + c + pos + '" class="icn3d-residue" style="color:#' + color + '">' + c + '</span>';
  }
  html += '</span><br>';

  html += '</div>';

  $("#div0").html(html);

  const initTooltips = () => {
    const $allPoppers = $('[data-title]');
    $allPoppers.each(function (i, elem) {
      const $this = $(this);

      const content = $this.attr('data-title');
      if (content) {
        $this.popover({
          content: content,
          trigger: 'hover',
          html: true,
          title: '',
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


}

