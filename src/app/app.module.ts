import {NgModule} from '@angular/core'
import {BrowserModule} from '@angular/platform-browser'
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'
import {RouteReuseStrategy} from '@angular/router'
import {HttpClientModule, HttpClient} from '@angular/common/http'
import {POSITION_OPTIONS} from '@ng-web-apis/geolocation'
import {TranslateModule, TranslateLoader} from '@ngx-translate/core'
import {TranslateHttpLoader} from '@ngx-translate/http-loader'

import {IonicModule, IonicRouteStrategy} from '@ionic/angular'
import {Geolocation} from '@ionic-native/geolocation/ngx'
import {AndroidPermissions} from '@ionic-native/android-permissions/ngx'
import {SplashScreen} from '@ionic-native/splash-screen/ngx'
import {StatusBar} from '@ionic-native/status-bar/ngx'
import {Keyboard} from '@ionic-native/keyboard/ngx'

import {SharedModule} from '@app/shared/shared.module'
import {AppComponent} from '@app/app.component'
import {AppRoutingModule} from '@app/app-routing.module'
import {SharedServicesModule} from '@app/shared/services/shared-services.module'

const positionConfig = {
  provide: POSITION_OPTIONS,
  useValue: {enableHighAccuracy: true, timeout: 3000, maximumAge: 1000}
}

export const createTranslateLoader = (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json')

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    IonicModule.forRoot(),
    AppRoutingModule,
    SharedModule,
    SharedServicesModule
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    },
    positionConfig,
    Geolocation,
    AndroidPermissions,
    SplashScreen,
    StatusBar,
    Keyboard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
