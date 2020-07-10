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

    let html = ``;
    for (const v of data.variants) {
      for (const al of v.alleles) {
        html += `<tr>`;
        html += `<td>${v.protein_name || ''}</td>`;
        html += `<td><a href="https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmdbid=1TSR&command=color+grey;+select+.A:20;+color+red;+style+sidec+stick">${al.protein_variant}</a></td>`;
        html += `<td>${al.count}</td>}`;
        html += `<td>${v.start}</td>`;
        html += `<td>${al.codon} > ${v.codon}</td>`;
        html += `<td>${al.aa_type}</td>`;
        html += `<td>${collectionLocation(al['Collection Location'] || [])}</td>`;
        html += `<td>${host(al.Host || [])}</td>`;
        html += `</tr>`;
      }

    }

    $tbody.append(html);
    $table.DataTable({
      pageLength: 100,
      "order": [[1, 'desc']]
    });

    $table.on('click', '.see-more-location', e=> {
      e.preventDefault();
      const $this = $(e.currentTarget);
      const $locations = $this.closest('td').find('span');

      if ($this.data('state') !== 'hidden'){
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





