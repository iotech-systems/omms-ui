

/* main app class -> entry point */
var app = {

   helpUrl: "https://omms.iotech.systems/help",
   lastClickedMeter: null,
   streamTbl: "",
   realtimeMon: null,
   orgNav: null,
   histogram: null,
   blockedMeterBtns: null,
   /* hold report results */
   lastReports: {clientSpaces: null
      , clientMeters: null},

   /* - - */
   init() {
      clickRouter.init();
      gui.loadDataBlockXml("orgNav", "subMenuCol");
      gui.loadDataBlockXml("systemOverview", "appViewport")
      setTimeout(app.readOmmsUser, 200);
      app.setAcl();
      app.applyAcl();
   },

   setAcl() {
      /* omms_acl=15 */
      let rx = /omms_acl=([0-9]{1,2})/gm;
      let m = rx.exec(document.cookie)
      if (m.length == 2) {
         app.ommsAcl = parseInt(m[1]);
      } else {
         app.ommsAcl = 1;
      }
   },

   applyAcl() {
      $("appbtn").each((_, appbtn) => {
            let acl = $(appbtn).attr("acl");
            if (app.ommsAcl < acl) {
               $(appbtn).removeClass("hover");
               $(appbtn).css("opacity", "0.28");
               $(appbtn).attr("title", "disabled for your ACL");
               $(appbtn).off();
            }
         });
   },

   /* - - */
   processMeters(jobj) {
      let navTree = new orgXmlNavTree(jobj);
      navTree.loadView("edge_name");
   },

   readOmmsUser() {
      let qkv = new queryStringKeyVal("UID");
      $("#userID").html(qkv.value(null));
   },

   /* http://85.222.109.238:4080/api/get/lastreading/kwhrs/1001 */
   meterOnClick() {
      try {
         /* set last clicked meter */
         app.lastClickedMeter = this;
         console.log(app.lastClickedMeter);
         /* load gui stuff */
         if ($("#appViewport #streamFrame").length == 0)
            gui.loadDataBlockXml("streamFrame", null);
         /* start running */
         realtimeMonitor.meterDBID = $(this).attr("dbid");
         /* run tick */
         realtimeMonitor.tick();
      } catch(e) {
         system.handleException(e);
         gui.clearViewport();
         gui.loadDataBlockXml("streamFrame", null);   
      }
   },

   blockOutButtons() {
      /* - - */
      let dbid = $(app.lastClickedMeter).attr("dbid"), 
         ctag = $(app.lastClickedMeter).attr("ctag"),
         selector = `div[dbid="${dbid}"].meter_button`;
      /* - - */
      let msg = `loading data for: ${ctag}`;
      $("#orgNavBodyBusy div").html(msg);
      app.fadeOutFadeIn("#orgNavBody", "#orgNavBodyBusy", 280);
      let btn = document.querySelector(selector);
      let ofLeft = btn.parentElement.offsetLeft,
         ofTop = btn.parentElement.offsetTop,
         cltHeight = btn.parentElement.clientHeight,
         cltWidth = btn.parentElement.clientWidth;
   },

   unblockoutButtons() {
      $("#orgNavBodyBusy div").html("");
      app.fadeOutFadeIn("#orgNavBodyBusy", "#orgNavBody", 280);
   },

   showDataLoading(txt) {
      let msg = `loading data for: <b>${txt}</b>`;
      $("#orgNavBodyBusy div").html(msg);
      $("#orgNavBody").fadeOut(280, () => {
            $("#orgNavBodyBusy").fadeIn(280);
         });
   },

   hideDataLoading() {
      $("#orgNavBodyBusy").fadeOut(280, () => {
            $("#orgNavBody").fadeIn(280);
         });
   },

   fadeOutFadeIn(outSelector, inSelector, speed) {
      $(outSelector).fadeOut(speed, () => {
            $(inSelector).fadeIn(speed);
         });
   },

   loadOrgNav() {
      app.orgNav = new orgNavigator();
      app.orgNav.init();
   },

   quickSelectChanged() {
      /* - - */
      let firstDayStr = "",
         lastDayStr = "",
         currentDate = new Date(),
         currentDayOfMonth = currentDate.getDate(),
         currentMonth = currentDate.getMonth(),
         currentFullYear = currentDate.getFullYear(),
         val = $(this).val(),
         selector = "#appViewport #startDate, #appViewport #endDate";
      let dayStr = (currentDayOfMonth < 10) ? `0${currentDayOfMonth}` : `${currentDayOfMonth}`;
      $("#kWhrsRptFrame .kwhrs-rpt-body").html("");
      /* - - */
      switch(val) {
         case "manual":
            {
               $(selector).val("");
               $(selector).removeAttr("disabled");
               return;
            }
         case "today":
            {
               currentMonth++;
               let monthStr = (currentMonth < 10) ? `0${currentMonth}` : `${currentMonth}`; 
               firstDayStr = `${currentFullYear}-${monthStr}-${dayStr}`;
               lastDayStr = firstDayStr;
            }
            break;
         case "thisMonth":
            {
               currentMonth++;
               let monthStr = (currentMonth < 10) ? `0${currentMonth}` : `${currentMonth}`; 
               firstDayStr = `${currentFullYear}-${monthStr}-01`;
               let ed = new Date(currentFullYear, currentMonth, 0);
               dayStr = (ed.getDate() < 10) ? `0${ed.getDate()}` : `${ed.getDate()}`;
               lastDayStr = `${currentFullYear}-${monthStr}-${dayStr}`;
            }
            break;
         case "lastMonth":
            {
               let monthStr = (currentMonth < 10) ? `0${currentMonth}` : `${currentMonth}`; 
               firstDayStr = `${currentFullYear}-${monthStr}-01`;
               let ed = new Date(currentFullYear, currentMonth, 0);
               dayStr = (ed.getDate() < 10) ? `0${ed.getDate()}` : `${ed.getDate()}`;
               lastDayStr = `${currentFullYear}-${monthStr}-${dayStr}`;
            }
            break;
         case "meterTotal":
            { 
               firstDayStr = "2020-01-01";
               lastDayStr = app.thisMonthLastDate();
            }
            break;
         default:
            break;
      }
      /* - - */
      $("#appViewport #startDate").val(firstDayStr);
      $("#appViewport #endDate").val(lastDayStr);
      $(selector).attr("disabled", "1");
   },

   thisMonthLastDate() {
      let currentDate = new Date(),
         currentFullYear = currentDate.getFullYear(),
         currentMonth = currentDate.getMonth();
      currentMonth++;
      let ed = new Date(currentFullYear, currentMonth, 0),
         monthStr = String(currentMonth).padStart(2),
         dayStr = String(ed.getDate()).padStart(2);
      /* - - */
      return `${currentFullYear}-${monthStr}-${dayStr}`;
   },

   getMonthLastDay(fullYear, month) {
      return new Date(fullYear, month, 0);
   },

   initStreamFrame() {
      realtimeMonitor.clearTimers();
      realtimeMonitor.streamTbl = null;
      realtimeMonitor.meterDBID = null;
      realtimeMonitor.callback = gui.displayRealtime;
      setTimeout(realtimeMonitor.tick, 200);
   }

};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* attach page loaded event */
window.addEventListener("DOMContentLoaded", app.init);
