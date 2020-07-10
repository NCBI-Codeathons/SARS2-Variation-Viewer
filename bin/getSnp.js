
// command: node getSnp.js [filename]
var myArgs = process.argv.slice(2);
var filename = myArgs[0];

var fs = require('fs');

fs.readFile(filename, 'utf8', function(err, dataStr) {
    if (err) throw err;

    function getPdbInfo(mapArray, acc_ver, resi) {
        var pdbinfoArray = [];
        var pos = acc_ver.indexOf('.');
        var acc = (pos == -1) ? acc_ver : acc_ver.substr(0, pos);

        for(var i = 0, il = mapArray.length; i < il; ++i) {
            var idArray = mapArray[i].split(' ');

            if(idArray.length != 5) console.log("Error in the mapping data");

            if(acc == idArray[0]) {
                var pdbid = idArray[1];
                var offset = parseInt(idArray[2]);
                var pdbResi = resi + offset;
                if(pdbResi >= parseInt(idArray[3]) && pdbResi <= parseInt(idArray[4])) {
                    var pdbinfo = {};

                    pdbinfo.pdbid = pdbid;
                    pdbinfo.resi = pdbResi;

                    pdbinfoArray.push(pdbinfo);
                }

                //break;
            }
        }

        return pdbinfoArray;
    }

    function getSnpHtml(posHash, range0, range1, bHistogram) {
        for(var i = range0; i < range1; ++i) {
            if(posHash.hasOwnProperty(i)) {
                var url = '';

                if(posHash[i].protein_accession) {
                    var acc_ver = posHash[i].protein_accession;
                    var resi = posHash[i].protein_position;

                    var pdbinfoArray = getPdbInfo(mapArray, acc_ver, resi);
                    var oriResn = posHash[i].amino_acid;

                    for(var index = 0, indexL = pdbinfoArray.length; index < indexL; ++index) {
                        var pdbinfo = pdbinfoArray[index];
                        if(pdbinfo.pdbid !== undefined) {
                            var pdbid = pdbinfo.pdbid, realResi = pdbinfo.resi;

                            var pdb_chain = pdbid.split('_');

                            url = pdbid + '\t' + (realResi-1).toString() + '\t' + realResi + '\t' + realResi + oriResn + '>';

                            for(var j = 0, jl = posHash[i].alleles.length; j < jl; ++j) {
                              var alleleItem = posHash[i].alleles[j];

                              if(alleleItem.aa_type == 'non_synonymous') {
                                  url += alleleItem.amino_acid;
                                  console.log(url);
                              }
                            } // for j
                        }
                    } // for index
                } // if
            } // if
        } // for i
    }

    var mapArray = [];
    // refseq acc, pdb chain, offset to get prd resi, start, end of pdb resi
    // no data for: YP_009725302, YP_009724394, YP_009725318, YP_009725255, YP_009724393

/*
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
*/

    mapArray.push('YP_009725298 1JWH_C -50 101 126');
    mapArray.push('YP_009725298 4NH1_C -50 101 126');
    mapArray.push('YP_009725298 1RQF_A -44 107 132');
    mapArray.push('YP_009725298 3EED_A -50 101 126');
    mapArray.push('YP_009725300 3VCB_A -407 30 94');
    mapArray.push('YP_009725300 3VC8_A -407 30 94');
    mapArray.push('YP_009725300 3GZF_A -403 35 96');
    mapArray.push('YP_009725300 1MOW_A -303 78 106');
    mapArray.push('YP_009724396 5O32_I 119 189 236');
    mapArray.push('YP_009725297 2GDT_A -11 2 116');
    mapArray.push('YP_009725299 6WUU_A -743 1 321');
    mapArray.push('YP_009725299 6XAA_A -742 3 318');
    mapArray.push('YP_009725299 6XA9_A -742 3 318');
    mapArray.push('YP_009725299 6W9C_A -745 1 315');
    mapArray.push('YP_009725299 6WZU_A -742 4 318');
    mapArray.push('YP_009725299 6YVA_A -745 1 315');
    mapArray.push('YP_009725299 6WRH_A -742 4 318');
    mapArray.push('YP_009725299 5E6J_A -744 2 318');
    mapArray.push('YP_009725299 4M0W_A -744 2 319');
    mapArray.push('YP_009725299 5TL6_B -741 5 319');
    mapArray.push('YP_009725299 3MJ5_A -744 2 316');
    mapArray.push('YP_009725299 2FE8_A -744 2 315');
    mapArray.push('YP_009725299 5Y3E_A -744 2 315');
    mapArray.push('YP_009725299 3E9S_A -742 4 318');
    mapArray.push('YP_009725299 4OVZ_B -744 2 316');
    mapArray.push('YP_009725299 4OVZ_A -744 2 316');
    mapArray.push('YP_009725299 2W2G_A -412 1 264');
    mapArray.push('YP_009725299 6WOJ_A -203 2 176');
    mapArray.push('YP_009725299 6WEY_A -205 2 172');
    mapArray.push('YP_009725299 6YWK_A -203 4 173');
    mapArray.push('YP_009725299 6VXS_A -204 2 170');
    mapArray.push('YP_009725299 2KQV_A -546 4 174');
    mapArray.push('YP_009725299 2ACF_A -198 7 176');
    mapArray.push('YP_009725299 2FAV_A -197 10 177');
    mapArray.push('YP_009725299 2JZF_A -532 5 143');
    mapArray.push('YP_009725299 2JZD_A -546 4 129');
    mapArray.push('YP_009725299 2K87_A -1087 2 116');
    mapArray.push('YP_009725299 2GRI_A 1 6 112');
    mapArray.push('YP_009725301 6XA4_A 2 3 308');
    mapArray.push('YP_009725301 7BRO_A 1 2 307');
    mapArray.push('YP_009725301 5R7Y_A 0 1 306');
    mapArray.push('YP_009725301 6XB0_A 0 1 306');
    mapArray.push('YP_009725301 6M0K_A 0 1 304');
    mapArray.push('YP_009725301 6WTT_A 0 1 304');
    mapArray.push('YP_009725301 6LZE_A 0 1 303');
    mapArray.push('YP_009725301 3M3V_A 2 3 308');
    mapArray.push('YP_009725301 2A5K_A 1 2 307');
    mapArray.push('YP_009725301 3E91_A 0 1 306');
    mapArray.push('YP_009725301 1UJ1_A 0 1 306');
    mapArray.push('YP_009725301 1WOF_A 5 6 311');
    mapArray.push('YP_009725301 3F9E_A 2 3 304');
    mapArray.push('YP_009725301 2PWX_A 2 3 308');
    mapArray.push('YP_009725301 5B6O_A 0 1 306');
    mapArray.push('YP_009725301 4HI3_A 1 2 307');
    mapArray.push('YP_009725301 2QC2_A 2 3 308');
    mapArray.push('YP_009725301 3M3T_A 2 3 308');
    mapArray.push('YP_009725301 3M3S_A 0 1 306');
    mapArray.push('YP_009725301 3EA9_A 0 1 306');
    mapArray.push('YP_009725301 1Z1J_A 0 1 306');
    mapArray.push('YP_009725301 3F9F_A 2 3 308');
    mapArray.push('YP_009725301 2QCY_A 0 1 306');
    mapArray.push('YP_009725301 2Q6G_A 0 1 306');
    mapArray.push('YP_009725301 3ATW_A 0 1 306');
    mapArray.push('YP_009725301 1Q2W_A 2 3 306');
    mapArray.push('YP_009725301 2ALV_A 0 1 303');
    mapArray.push('YP_009725301 2VJ1_A -1 1 303');
    mapArray.push('YP_009725301 4MDS_A 0 1 303');
    mapArray.push('YP_009725301 2OP9_A 1 2 302');
    mapArray.push('YP_009725301 3SNA_A 0 1 301');
    mapArray.push('YP_009725301 2QIQ_A 0 1 301');
    mapArray.push('YP_009725301 3FZD_A 0 1 301');
    mapArray.push('YP_009725301 3F9G_A 2 3 303');
    mapArray.push('YP_009725301 3D62_A -2 1 299');
    mapArray.push('YP_009725303 7BV1_C 1 2 84');
    mapArray.push('YP_009725303 6X2G_C 1 2 84');
    mapArray.push('YP_009725303 6WIQ_A 3 4 86');
    mapArray.push('YP_009725303 6M71_C 0 1 83');
    mapArray.push('YP_009725303 7C2K_C 2 3 85');
    mapArray.push('YP_009725303 2AHM_A 5 6 88');
    mapArray.push('YP_009725303 6NUR_C 1 2 84');
    mapArray.push('YP_009725303 1YSY_A 2 3 85');
    mapArray.push('YP_009725303 6M5I_C 0 1 82');
    mapArray.push('YP_009725303 6YHU_A 0 1 71');
    mapArray.push('YP_009725303 3UB0_B 4 5 87');
    mapArray.push('YP_009725304 7BV1_B 1 2 199');
    mapArray.push('YP_009725304 6X2G_B 1 2 199');
    mapArray.push('YP_009725304 6YYT_B 3 4 201');
    mapArray.push('YP_009725304 6M5I_B 0 1 198');
    mapArray.push('YP_009725304 7C2K_B 2 3 200');
    mapArray.push('YP_009725304 6NUR_B 0 1 198');
    mapArray.push('YP_009725304 2AHM_E 5 6 203');
    mapArray.push('YP_009725304 5F22_B -64 3 134');
    mapArray.push('YP_009725304 6WIQ_B -76 1 122');
    mapArray.push('YP_009725304 6YHU_B -75 1 117');
    mapArray.push('YP_009725304 3UB0_A 4 5 194');
    mapArray.push('YP_009725305 6W9Q_A 20 21 133');
    mapArray.push('YP_009725305 6W4B_A 4 5 117');
    mapArray.push('YP_009725305 6WXD_A 3 4 116');
    mapArray.push('YP_009725305 1UW7_A 30 31 143');
    mapArray.push('YP_009725305 1QZ8_A 0 1 113');
    mapArray.push('YP_009725305 3EE7_A 0 1 113');
    mapArray.push('YP_009725306 6W4H_B 3 4 142');
    mapArray.push('YP_009725306 6W61_B 1 2 140');
    mapArray.push('YP_009725306 7C2I_B 5 6 144');
    mapArray.push('YP_009725306 7BQ7_B 0 1 139');
    mapArray.push('YP_009725306 2G9T_A 0 1 139');
    mapArray.push('YP_009725306 5C8S_A 5 6 144');
    mapArray.push('YP_009725306 5NFY_M 7 8 138');
    mapArray.push('YP_009725306 3R24_B 3 13 142');
    mapArray.push('YP_009725306 6YZ1_B -8 2 123');
    mapArray.push('YP_009725306 6ZCT_A -6 3 125');
    mapArray.push('YP_009725306 2FYG_A -4 6 128');
    mapArray.push('YP_009725306 2XYQ_B -9 1 122');
    mapArray.push('YP_009725306 2XYV_B -9 1 122');
    mapArray.push('YP_009725306 5YN5_B 0 1 138');
    mapArray.push('YP_009725307 7C2K_A 2 3 934');
    mapArray.push('YP_009725307 6X2G_A 1 2 933');
    mapArray.push('YP_009725307 6M71_A 0 1 932');
    mapArray.push('YP_009725307 6YYT_A 3 4 935');
    mapArray.push('YP_009725307 7BV1_A 1 2 933');
    mapArray.push('YP_009725307 7BW4_A -9 1 923');
    mapArray.push('YP_009725307 6NUR_A 2 3 933');
    mapArray.push('YP_009725308 6JYT_A 2 3 603');
    mapArray.push('YP_009725308 5WWP_A 2 3 592');
    mapArray.push('YP_009725309 5C8S_B 0 1 527');
    mapArray.push('YP_009725309 5C8T_B 1 2 528');
    mapArray.push('YP_009725309 5NFY_A 7 8 534');
    mapArray.push('YP_009725310 6XDH_A 22 23 368');
    mapArray.push('YP_009725310 2OZK_A 0 1 346');
    mapArray.push('YP_009725310 2RHB_A 7 8 353');
    mapArray.push('YP_009725310 2H85_A 2 3 347');
    mapArray.push('YP_009725310 5YVD_A 0 2 116');
    mapArray.push('YP_009725310 2GTH_A 1 2 108');
    mapArray.push('YP_009725310 2GTI_A 1 2 108');
    mapArray.push('YP_009725310 4RS4_A 2 3 109');
    mapArray.push('YP_009725310 4S1T_A 2 3 109');
    mapArray.push('YP_009725311 6W4H_A 3 4 301');
    mapArray.push('YP_009725311 6YZ1_A 1 2 299');
    mapArray.push('YP_009725311 7BQ7_A 0 1 298');
    mapArray.push('YP_009725311 7C2I_A 7 8 305');
    mapArray.push('YP_009725311 6W61_A 1 2 299');
    mapArray.push('YP_009725311 3R24_A 46 47 344');
    mapArray.push('YP_009725311 2XYR_A 0 1 292');
    mapArray.push('YP_009725311 2XYQ_A 0 1 290');
    mapArray.push('YP_009725311 5YN5_A 0 1 297');
    mapArray.push('YP_009724391 6XDC_A 0 1 275');
    mapArray.push('YP_009724395 1XAK_A -13 1 82');
    mapArray.push('YP_009724395 1YO4_A -13 3 86');
    mapArray.push('YP_009724395 6W37_A -15 1 67');
    mapArray.push('YP_009724390 7C2L_A 0 1 1273');
    mapArray.push('YP_009724390 6XCM_A 0 1 1213');
    mapArray.push('YP_009724390 6ZGG_A 31 32 1256');
    mapArray.push('YP_009724390 6ZGE_A 31 32 1256');
    mapArray.push('YP_009724390 7BYR_A 0 1 1208');
    mapArray.push('YP_009724390 6VSB_A 0 1 1208');
    mapArray.push('YP_009724390 6Z43_A 0 1 1208');
    mapArray.push('YP_009724390 6VXX_A 19 32 1230');
    mapArray.push('YP_009724390 6VYB_A 19 32 1230');
    mapArray.push('YP_009724390 6X6P_A -14 1 1194');
    mapArray.push('YP_009724390 6X29_A -15 1 1193');
    mapArray.push('YP_009724390 6X2C_A -15 1 1193');
    mapArray.push('YP_009724390 6X2A_A -15 1 1193');
    mapArray.push('YP_009724390 6ZGF_A 31 32 711');
    mapArray.push('YP_009724390 6ACC_A -18 665 1196');
    mapArray.push('YP_009724390 5WRG_A -18 665 1196');
    mapArray.push('YP_009724390 5X58_A -31 652 1180');
    mapArray.push('YP_009724390 6NB6_A 1 684 1212');
    mapArray.push('YP_009724390 6CRV_A -31 652 1177');
    mapArray.push('YP_009724390 6CRW_A -31 652 1177');
    mapArray.push('YP_009724390 6M3W_A -705 1 491');
    mapArray.push('YP_009724390 6XE1_E -318 1 273');
    mapArray.push('YP_009724390 6XDG_E -318 1 223');
    mapArray.push('YP_009724390 6M0J_E -318 1 224');
    mapArray.push('YP_009724390 6W41_C -318 1 223');
    mapArray.push('YP_009724390 6M17_E -318 1 223');
    mapArray.push('YP_009724390 7BWJ_E -318 1 211');
    mapArray.push('YP_009724390 6LZG_B -318 1 209');
    mapArray.push('YP_009724390 6YLA_A -326 4 206');
    mapArray.push('YP_009724390 6YZ5_E -329 1 203');
    mapArray.push('YP_009724390 6YOR_A -329 1 203');
    mapArray.push('YP_009724390 7C8V_B -326 4 209');
    mapArray.push('YP_009724390 6Z2M_A -331 1 197');
    mapArray.push('YP_009724390 6ZCZ_E -323 10 205');
    mapArray.push('YP_009724390 6VW1_E -318 1 217');
    mapArray.push('YP_009724392 5X29_A 16 20 81');
    mapArray.push('YP_009724392 2MM4_A -7 1 58');
    mapArray.push('YP_009724397 6YI3_A -40 3 140');
    mapArray.push('YP_009724397 6M3M_A -38 3 136');
    mapArray.push('YP_009724397 1SSK_A -22 21 158');
    mapArray.push('YP_009724397 6WKP_A -45 2 128');
    mapArray.push('YP_009724397 6VYO_A -45 2 128');
    mapArray.push('YP_009724397 2OFZ_A -35 13 138');
    mapArray.push('YP_009724397 6WZQ_A -227 20 137');
    mapArray.push('YP_009724397 6WJI_A -243 4 121');
    mapArray.push('YP_009724397 6YUN_A -229 18 135');
    mapArray.push('YP_009724397 7C22_A -244 3 120');
    mapArray.push('YP_009724397 2CJR_A -236 11 128');
    mapArray.push('YP_009724397 2GIB_A -266 3 103');
    mapArray.push('YP_009724397 4UD1_A -6 6 164');
    mapArray.push('YP_009724397 3HD4_A -40 54 136');
    mapArray.push('YP_009724397 6G13_A -244 15 84');
    mapArray.push('YP_009724397 2GEC_A -38 56 126');
    mapArray.push('YP_009724397 2BXX_A -43 51 121');
    mapArray.push('YP_009724397 2BTL_A -43 51 121');
    mapArray.push('YP_009724397 5N4K_A -22 68 116');

    var data = JSON.parse(dataStr);
    var snpData = data.variants;
    var range0 = data.segments[0].range[0], range1 = data.segments[0].range[1];

    var posHash = {};
    for(var i = 0, il = snpData.length; i < il; ++i) {
        var pos = snpData[i].start;
        posHash[pos] = snpData[i];
    }

    var bHistogram;
    //bHistogram = true;
    //html += getSnpHtml(posHash, range0, range1, bHistogram);
    bHistogram = false;
    getSnpHtml(posHash, range0, range1, bHistogram);
});

