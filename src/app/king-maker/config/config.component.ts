import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  dataSource = [{
    filteredData: []
  }
  ];
  displayedColumns = [{
    filteredData: []
  }
  ];
  constructor() { }

  ngOnInit() {
  }

}
