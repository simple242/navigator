import {Component, OnDestroy} from '@angular/core'
import {Platform} from '@ionic/angular'
import {SplashScreen} from '@ionic-native/splash-screen/ngx'
import {StatusBar} from '@ionic-native/status-bar/ngx'

import {AppService} from '@app/shared/services'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnDestroy {

  constructor(
    private appSvc: AppService,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.platform.ready().then(() => {
      this.statusBar.hide()

      setTimeout(() => {
        this.splashScreen.hide()
      }, 500)
    })

    this.appSvc.initializeApp()
  }

  ngOnDestroy() {
    this.appSvc.destroyApp()
  }

}
