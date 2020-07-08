import {cartoonData} from "../mock-data/data.js";
import {Cartoon} from "./modules/cartoon.js";

document.addEventListener('DOMContentLoaded', event => {
  const cartoon = new Cartoon({data: cartoonData});
});