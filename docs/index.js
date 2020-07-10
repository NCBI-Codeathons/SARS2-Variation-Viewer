import {data} from "./mock-data/protein_annotated_without_metadata.js";
import {Cartoon} from "./modules/cartoon.js";
import {Table} from "./modules/table.js";
import {detailsView} from './modules/details.js';

$(document).ready(function () {
  const cartoon = new Cartoon({data});
  const table = new Table({data})
  detailsView(data)
});
