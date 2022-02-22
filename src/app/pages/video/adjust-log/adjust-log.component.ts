import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-adjust-log',
  templateUrl: './adjust-log.component.html',
  styleUrls: ['./adjust-log.component.scss']
})
export class AdjustLogComponent implements OnInit {
  collection: any = {};
  
  constructor() { }

  ngOnInit() {
  }

  setCollection(collection) {
    this.collection = collection;
}
}
