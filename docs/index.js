import { data } from "./mock-data/protein_and_metadata.js";
import { Cartoon } from "./modules/cartoon.js";
import { Table } from "./modules/table.js";
import { detailsView } from './modules/details.js';

$(document).ready(function () {
  const cartoon = new Cartoon({ data });
  const table = new Table({ data })
  $('#details-tab').on('click', e => {
    const $this = $(this);
    if (!$this.data('load')) {
      detailsView(data);
      $this.data('load', true);
    } else {
      console.info("details view is already loaded.")
    }
  });


});
