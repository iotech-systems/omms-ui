
class histogram {

   static KILO = 1000;

   constructor(meter, data) {
      this.meter = meter;
      this.data = data.reverse();
      this.chart = null;
   }

   draw() {
      this.drawActivePower();
   }

   update(jobj, data) {
      try {
         this.data = data.reverse();
         let [lbls, total, l1, l2, l3] = this.activePowerDatasets();
         /* - - */
         if (this.chart)
            this.chart.destroy();
         /* - - */
         let [ctx, conf] = this.getCntxConf(); 
         this.chart = new Chart(ctx, conf);
         this.chart.data.labels = lbls;
         this.chart.data.datasets = [total, l1, l2, l3];
         this.chart.update();
      } catch(e) {
         alert(e);
      }
   }

   reset() {
      if (this.chart)
         this.chart.destroy();
   }

   getCntxConf() {
      var ctx = document.getElementById("canvasAmps");
      let yMax = (parseInt(this.meter.max_amps) * parseInt(this.meter.voltage));
      if (this.meter.meter_type = "e3phase")
         yMax *= 3;
      let unit = (yMax > histogram.KILO) ? "kW" : "Watts";
      let max = (yMax > histogram.KILO) ? (yMax / histogram.KILO).toFixed(1) : yMax;
      let ytext = `Circuit Max: ${max} ${unit}`;
      
      let __scales = {
            y: {
               type: "logarithmic",
               beginAtZero: true,
               suggestedMax: yMax,
               title: {display: true, text: ytext}
            },
            x: {
               title: {display: true, text: "timestamps are in UTC"}
            }
         };
      
      let [lbls, xtotal, xl1, xl2, xl3] = this.activePowerDatasets();

      /* - - */
      let conf = {type: "line",
            data: {
               labels: lbls,
               datasets: [xtotal, xl1, xl2, xl3]
            },
            options: {
               scales: __scales,
               plugins: {
                  legend: {
                     display: true,
                     labels: {
                        color: "darkred"
                     }
                  }
               }
            }
         };
      /* - - */
      return [ctx, conf];
   }

   drawActivePower() {

      var ctx = document.getElementById("canvasAmps");
      let yMax = (parseInt(this.meter.max_amps) * parseInt(this.meter.voltage));
      if (this.meter.meter_type = "e3phase")
         yMax *= 3;
      let unit = (yMax > histogram.KILO) ? "kW" : "Watts";
      let max = (yMax > histogram.KILO) ? (yMax / histogram.KILO).toFixed(1) : yMax;
      let ytext = `Circuit Max: ${max} ${unit}`;
      
      let __scales = {
            y: {
               type: "logarithmic",
               beginAtZero: true,
               suggestedMax: yMax,
               title: {display: true, text: ytext}
            },
            x: {
               title: {display: true, text: "timestamps are in UTC"}
            }
         };
      
      let [lbls, xtotal, xl1, xl2, xl3] = this.activePowerDatasets();

      /* - - */
      let conf = {type: "line",
            data: {
               labels: lbls,
               datasets: [xtotal, xl1, xl2, xl3]
            },
            options: {
               scales: __scales,
               plugins: {
                  legend: {
                     display: true,
                     labels: {
                        color: "darkred"
                     }
                  }
               }
            }
         };
      
      /* - - */
      this.chart = new Chart(ctx, conf);

   }

   activePowerData() {
      let total = [], lbls = [], l1 = [], l2 = [], l3 = [];
      for (let i in this.data) {
         let obj = this.data[i];
         total.push(obj.total_active_pwr);
         l1.push(obj.l1_active_pwr);
         l2.push(obj.l2_active_pwr);
         l3.push(obj.l3_active_pwr);
         /* remove date part */
         lbls.push(obj.reading_dts_utc.split("T")[1]);
      }
      /* - - */
      return [lbls, total, l1, l2, l3];
   }

   activePowerDatasets() {

      let [lbls, total, l1, l2, l3] = this.activePowerData();

      let xtotal = {
         label: "Total Active Power (Watts)",
         data: total,
         backgroundColor: ["black"],
         borderColor: ["black"],
         borderWidth: 3
      };

      let xl1 = {
            label: "L1 Active Power (Watts)",
            data: l1,
            backgroundColor: ["blue"],
            borderColor: ["blue"],
            borderWidth: 1
         };

      let xl2 = {
            label: "L2 Active Power (Watts)",
            data: l2,
            backgroundColor: ["green"],
            borderColor: ["green"],
            borderWidth: 1
         };
      
      let xl3 = {
            label: "L3 Active Power (Watts)",
            data: l3,
            backgroundColor: ["red"],
            borderColor: ["red"],
            borderWidth: 1
         };
      
      /* - - */
      return [lbls, xtotal, xl1, xl2, xl3];

   }

}