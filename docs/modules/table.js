export class Table {
  constructor({data}) {
    const table = $('#table').DataTable({
      pageLength: 50,
      data: data.variants,
      "columns": [
        {"data": 'reference_sequence'},
        {"data": 'start'},
        {"data": 'stop'},

        {
          "data": 'alleles', render: (data, type, row, meta) => {
            let html = ``;
            const {allele, count, spdi, attributes} = data[0];
            html += `${allele}, count:${count}, spdi:${spdi}`
            if (attributes) {
              for (const d of attributes) {
                const {name, values} = d;
                html += `<br /><b>${name}</b>`
                for (const dd of values) {
                  html += `<br />${dd.value} (${dd.count})`
                }

              }
            }
            return html;
          }
        },
      ]
    });
  }
}
