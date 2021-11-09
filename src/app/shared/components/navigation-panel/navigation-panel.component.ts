import {Component, OnInit} from '@angular/core'

import {NavigatorService} from '@app/shared/services'

@Component({
  selector: 'app-navigation-panel',
  templateUrl: './navigation-panel.component.html',
  styleUrls: ['./navigation-panel.component.scss']
})
export class NavigationPanelComponent implements OnInit {

  constructor(
    public navigatorSvc: NavigatorService
  ) {
  }

  ngOnInit() {
  }

}
