
var gui = {

   viewport: "#appViewport",
   submenucol: "#subMenuCol",
   lastHistogramMD5: "",

   displayRealtime(resJObj) {
      /* check if histogram */
      if (resJObj.streamTbl == "__histogram") {
         gui.displayHistogram(resJObj);
      } else {
         app.histogram = null;
         $("#canvasAmps").remove();
         /* update readltime header info */
         let jsonbuff = $(app.lastClickedMeter).find("jsonbuff").text(),
            jobj = JSON.parse(jsonbuff);
         /* - - */
         let dts = new Date().toLocaleString("PL").replace(",", "&nbsp;&nbsp;"), 
            txt = `last refreshed: ${dts}&nbsp;&nbsp;&nbsp;&nbsp;circuit: <b>${jobj.circuit_tag}</b>` + 
            `&nbsp;&nbsp;&nbsp;&nbsp;bus type: <b>${jobj.bus_type}</b>` + 
            `&nbsp;&nbsp;&nbsp;&nbsp;bus address: <b>${jobj.bus_address}</b>`+ 
            `&nbsp;&nbsp;&nbsp;&nbsp;meter type: <b>${jobj.meter_type}</b>`;
         /* - - */
         $("#streamFrmHeader").html(txt);
         /* load data cols */
         gui.loadRealtimeCols(resJObj);
      }
   },

   loadRealtimeCols(jobj) {
      /* loads up to 12 per col */
      $("#canvasAmps").remove();
      $("#streamFrmLfCol, #streamFrmRtCol").css("display", "inline-block");
      $("#streamFrmRtCol, #streamFrmLfCol").html("");
      let idx = 0, MAX_ROWS = 12;
      for (let p in jobj) {
         let targetCol = (idx++ < MAX_ROWS) ? "streamFrmRtCol" : "streamFrmLfCol";
         let collbl = gui.getLabelFromName(p), 
            buff = html.lblTextBox(collbl, jobj[p]);
         /* - - */
         $(`#${targetCol}`).append(buff);
      }
   },

   displayHistogram(resJObj) {
      /* - - */
      if (this.lastHistogramMD5 == resJObj.md5)
         return;
      else
         this.lastHistogramMD5 = resJObj.md5;   
      /* update readltime header info */
      let jsonbuff = $(app.lastClickedMeter).find("jsonbuff").text(),
      jobj = JSON.parse(jsonbuff);
      /* - - */
      /* let dts = new Date().toLocaleString("PL").replace(",", "&nbsp;&nbsp;"), */
      let txt = `<b>[&nbsp;histogram&nbsp;]</b>&nbsp;&nbsp;&nbsp;` + 
         `&nbsp;circuit:&nbsp;<b>${jobj.circuit_tag}</b>` +
         `&nbsp;&nbsp;&nbsp;&nbsp;max amps: <b>${jobj.max_amps}</b>` +  
         `&nbsp;&nbsp;&nbsp;&nbsp;bus type: <b>${jobj.bus_type}</b>` + 
         `&nbsp;&nbsp;&nbsp;&nbsp;bus address: <b>${jobj.bus_address}</b>`+ 
         `&nbsp;&nbsp;&nbsp;&nbsp;meter type: <b>${jobj.meter_type}</b>`;
      /* - - */
      $("#streamFrmHeader").html(txt);
      /* hide cols */
      $("#streamFrmLfCol, #streamFrmRtCol").css("display", "none");
      /* bring up canvas */
      let canvas = `<canvas id="canvasAmps" class="canvas-amps"></canvas>`;
      if ($("#canvasAmps").length == 0)
         $("#streamFrame .stream-frm-body").append(canvas);
      /* - - */
      if (app.histogram) {
         app.histogram.update(jobj, resJObj.rows);
      } else {
         app.histogram = new histogram(jobj, resJObj.rows);
         app.histogram.draw();
      }
   },
   
   getLabelFromName(p) {   
      let lbls = colNamesTable.en;
      if (lbls[p])
         return lbls[p];
      else
         return p;
   },

   subMenu: {
      load(htmlBuff) {
         $(gui.submenucol).html(htmlBuff);
      }
   },

   clearViewport() {
      $(gui.viewport).html("");
   },

   /* looks in data bock */
   loadDataBlockXml(blockID, targetID = null, newID = false) {
      /* set target id */
      targetID = (targetID == null) ? gui.viewport : `#${targetID}`;
      /* zero elmt is a pure html obj; no jq wrapper */
      let obj = $(`#dataBlock #${blockID}`)[0],
         buff = gui.fixScriptTag(obj.outerHTML),
         buffNewID = targetID;
      if (newID) {
         let ts = Date.now();
         buffNewID = `${blockID}_${ts}`;
         buff = buff.replace(blockID, buffNewID);
      }
      /* gui objs need unique ids */
      $(targetID).html(buff);
      /* - - */
      return buffNewID;
   },

   updateOrgNavBox(jarr) {
      for (let i in jarr)
         console.log(jarr[i]);
   },

   loadHelp() {
      $(gui.viewport).html("");
      $(gui.viewport).html(`<iframe class="iframe-help" src="${app.helpUrl}" />`);
   },

   fixScriptTag(buff) {
      return buff.replace( "script__", "</script>").replace("__script", "<script>");
   },

   /* 
      adds a line to the report
      do sum for each here!!!
   */
   kWhrsReportLineAdd(clt, data, jarr) {
      switch(data.aggreateOn) {
         case "client_meter":
            gui.__client_meter__(clt, data, jarr);
            break;
         case "client_space":
            gui.__client_space__(clt, data, jarr);
            break;
         default:
            break;
      }
   },

   __client_space__(clt, data, jarr) {
      /* - - */
      gui.__client_total__(clt, jarr)
      if (data.totalOnly)
         return;
      /* add circuit reads */
      let lns = [], 
         dops = new dataOps(),
         localReport = dops.getPerClientSpaceSummary(clt, jarr);
      app.lastReports.clientSpaces.push(localReport);
      /* - - */
      for (let p in localReport.lnsObj) {
         let ln = localReport.lnsObj[p];
         lns.push(html.kwhrsReportLinePerSpace(ln));
      }
      /* - - */
      if (lns.length == 0)
         lns.push(html.kwhrsReportLinePerSpace(null));
      /* - - */
      let cltboxid = `cbid_${clt.client_tag}`,
         selector = `#${cltboxid} .clt-meter-lst`;
      /* - - */
      $(selector).append(lns.join(""));
   },

   /* 
      report per client per meter 
   */
   __client_meter__(clt, data, jarr) {
      /* - - */
      gui.__client_total__(clt, jarr)
      if (data.totalOnly)
         return;
      /* - - */
      let lns = [], 
         dops = new dataOps(),
         localReport = dops.getPerClientMeterSummary(clt, jarr);
      /* cache here */
      app.lastReports.clientMeters.push(localReport);
      /* -- stores report for export */
      for (let p in localReport.lnsArr) {
         let ln = localReport.lnsArr[p];
         lns.push(html.kwhrsReportLinePerSpace(ln));
      }
      /* - - */
      if (lns.length == 0)
         lns.push(html.kwhrsReportLinePerSpace(null));
      /* - - */
      let cltboxid = `cbid_${clt.client_tag}`,
         selector = `#${cltboxid} .clt-meter-lst`;
      /* - - */
      $(selector).append(lns.join(""));
   },

   /* 
      total header per client 
   */
   __client_total__(clt, jarr) {
      let total = dataOps.kWhrsReportTotal(jarr),
         cltboxid = `cbid_${clt.client_tag}`,
         cltbox = html.kwhrsReportCltBox(clt, cltboxid, total),
         selector = "#kWhrsRptFrame .kwhrs-rpt-body";
      $(selector).append(cltbox);
   },

   activateMeters(entag, jarr) {
      /* - - */
      for (let i in jarr) {
         let dbid = jarr[i].fk_meter_dbid,
            selector = `div[entag="${entag}"][dbid="${dbid}"].meter_button_dim`;
         /* - - */
         $(selector).removeClass("meter_button_dim").addClass("meter_button");
         selector = `div[entag="${entag}"][dbid="${dbid}"].meter_button`;
         $(selector).attr("title", "data found");
         $(selector).off().on("click", app.meterOnClick);
      }
   },

   format_kwh(kwh) {
      let lng = window.navigator.language, 
         opts = {minimumFractionDigits: 2};
      return parseFloat(kwh).toLocaleString(lng, opts);
   }

}




/* to keep number of files down */
class lightBoxedPane {

   constructor(title0, title1, body) {
      this.title0 = title0;
      this.title1 = title1;
      this.body = body;
      this.paneID = null;
   }

   show() {
      this.lightBoxOn();
      this.paneID = gui.loadDataBlockXml("lbPane", "lightboxPaneFrame", true);
      this.loadPane();
   }

   showLoading(spinner) {
      if ($("lightbox").length == 0) {
         $("body").append("<lightbox></lightbox>");
         $("body").append(spinner);   
      }
   }

   lightBoxOn() {
      if ($("lightbox").length == 0) {
         /* light box pane */
         $("body").append("<lightbox></lightbox>");
         $("body").append(`<div id="lightboxPaneFrame" class="lb-pane-frame"></div>`);   
      }
   }

   loadPane() {
      $("body #lbPaneTitle0").html(this.title0);
      $("body #lbPaneTitle1").html(this.title1);
      $("body #lbPaneBody").html(this.body);
      let __this = this, 
         selector = `body #${this.paneID} #lbPaneClose`;
      $(selector).click(function() {
            __this.onClickX();
         });
   }

   loadBottomBar(html) {
      $("body #lbPaneBottom").html(html);
   }

   onClickX() {
      let selector = `body #${this.paneID}, body #lightboxPaneFrame, body lightbox`;
      $(selector).remove();
      $(`div.loading-spinner`).remove();
   }

}
