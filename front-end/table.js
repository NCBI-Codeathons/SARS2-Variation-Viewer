export class Table {
  constructor({data}) {
    const table = $('#table').DataTable({
      pageLength: 50,
      data: data.variants,
      "columns": [
        {"data": 'start'},
        {"data": 'stop'},
        {"data": 'reference_sequence'},
        {
          "data": 'alleles', render: (data, type, row, meta) => {
            const {allele, count, spdi} = data[0];
            return `${allele}, count:${count}, spdi:${spdi}`
          }
        },
      ]
    });
  }
}
