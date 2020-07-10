// export class Table {
//   constructor({data}) {
//     const table = $('#table').DataTable({
//       pageLength: 50,
//       data: data.variants,
//       "columns": [
//         {
//           "data": 'protein_name', render: (d, t, r, m) => {
//             return d;
//           }
//         },
//         {"data": 'protein_name', render: () => ''},
//         {"data": 'protein_name', render: () => ''},
//         {"data": 'protein_name', render: () => ''},
//         {"data": 'codon'},
//         {"data": 'protein_name', render: () => ''},
//         {
//           "data": 'alleles', render: (data, type, row, meta) => {
//             let html = ``;
//             const {allele, count, spdi, attributes} = data[0];
//             html += `${allele}, count:${count}, spdi:${spdi}`
//             if (attributes) {
//               for (const d of attributes) {
//                 const {name, values} = d;
//                 html += `<br /><b>${name}</b>`
//                 for (const dd of values) {
//                   html += `<br />${dd.value} (${dd.count})`
//                 }
//
//               }
//             }
//             return html;
//           },
//
//         },
//         {"data": 'alleles', render: (d, t, r, m) => 'n/a'}
//       ]
//     });
//   }
// }
import {getPdbInfo, mapArray} from "./details.js";

export class Table {
  constructor({data}) {
    const $table = $('#table');
    const $tbody = $table.find('tbody');
    const host = hosts => {
      const hostHtml = [];
      for (const h of hosts) {
        hostHtml.push(
          h.value + '(' + h.count + ')'
        )
      }
      return hostHtml.join('<br />');
    };

    const collectionLocation = collectionLocations => {
      const collectionLocationHtml = [];
      collectionLocations.sort((a, b) => a.count > b.count);
      let i = 0;
      for (const cl of collectionLocations) {
        i = i + 1;
        const css = i > 2 ? 'display:none' : '';
        collectionLocationHtml.push(
          `<span style="${css}">${cl.value} (${cl.count})<br /></span>`
        )
      }

      let h = collectionLocationHtml.join('')
      if (i > 2) {
        h += '<a href="#" class="see-more-location">see more</a>';
      }
      return h;
    };

    const createLinkToICN3d = (variant, al) => {
      let url = '';

      let realResi, oriResn, proteinName;
      if (variant.protein_accession) {
        var acc_ver = variant.protein_accession;
        var resi = variant.protein_position;
        proteinName = variant.protein_name;

        var pdbinfo = getPdbInfo(mapArray, acc_ver, resi);
        oriResn = variant.amino_acid;

        if (pdbinfo.pdbid !== undefined) {
          var pdbid = pdbinfo.pdbid;
          realResi = pdbinfo.resi;

          var pdb_chain = pdbid.split('_');


          url = 'https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmdbid=' + pdb_chain[0]
            + '&command=view+annotations;+set+annotation+cdd;+set+annotation+snp;+set+annotation+3ddomain;+set+annotation+site;+set+annotation+ssbond;+set+annotation+crosslink;+set+view+detailed+view;+select+chain+!' + pdb_chain[1]
            + ';+show+selection;+color+secondary+structure+green;+select+.' + pdb_chain[1]
            + ':' + realResi + ';+color+FFA500;+style+sidec+stick;+your+note+|+' + realResi + oriResn + '>';
        }
        return url !== '' ? `<a href="${url}">${al.protein_variant}</a>` : al.protein_variant;
      }
      return '';
    }

    let html = ``;
    for (const v of data.variants) {
      for (const al of v.alleles) {
        html += `<tr>`;
        html += `<td>${v.protein_name || 'n/a'}</td>`;
        html += `<td>${createLinkToICN3d(v, al) || 'n/a'}</td>`;

        html += `<td>${al.count}</td>}`;
        html += `<td>${v.start + 1}</td>`;

        html += `<td>${al.codon && v.codon ? al.codon + ' > ' + v.codon: ''}</td>`;

        html += `<td>${al.aa_type}</td>`;
        html += `<td>${collectionLocation(al['Collection Location'] || [])}</td>`;
        html += `<td>${host(al.Host || [])}</td>`;
        html += `</tr>`;
      }

    }

    $tbody.append(html);
    $table.DataTable({
      pageLength: 100,
      "order": [[1, 'asc']]
    });

    $table.on('click', '.see-more-location', e => {
      e.preventDefault();
      const $this = $(e.currentTarget);
      const $locations = $this.closest('td').find('span');

      if ($this.data('state') !== 'hidden') {
        $locations.show();
        $this.data('state', 'hidden')
        $this.text('see less')
      } else {
        $locations.hide();
        $locations.filter(':lt(3)').show();
        $this.data('state', '')
        $this.text('see more')
      }
    })
  }
}





