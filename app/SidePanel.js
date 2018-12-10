/*
| Copyright 2018 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
| http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
define([
  "esri/views/SceneView",
  "esri/WebScene",
  "esri/renderers/SimpleRenderer",  
  "esri/tasks/support/Query",
  "esri/tasks/QueryTask",
  "esri/layers/FeatureLayer",
  "esri/tasks/support/FeatureSet",
  "esri/tasks/support/StatisticDefinition",
  "esri/Map",
  "esri/views/MapView",
  "esri/core/watchUtils",

  "dojo/_base/declare",
  "dojo/topic",
  "dojo/_base/lang",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-attr"
], function(SceneView, WebScene, SimpleRenderer,
   Query, QueryTask, FeatureLayer, FeatureSet, StatisticDefinition, Map, MapView, watchUtils,
   declare, topic, lang, dojoOn, dom, domAttr) 
   {
  "use strict";

  return {
   
    startup: function(view , config) {
      this.config = config;
      this.view = view;

      this.floodSliderValue = -1;

      if (this.floodSliderValue === -1){
        dom.byId(SLRSliderMessage).innerHTML = this.config.flood_risk_name + ": " + "no flooding";
      }
      else{
        dom.byId(SLRSliderMessage).innerHTML = this.config.flood_risk_name + ": " + this.floodSliderValue + " " + this.config.flood_unit;
      }

      dom.byId("btnDecreaseFloodLevel").disabled = true;
      dom.byId("btnIncreaseFloodLevel").disabled = false;
      
      this.view.when(
        function() {
          this.buildingLayer = this.view.map.allLayers.find(function(l) {
            return ( l.title.toLowerCase() === this.config.buildingLayerName.toLowerCase());
          }.bind(this));

          // console.log(this.buildingLayer);

          this.floodlevelsGroupLayer = this.view.map.allLayers.find(function(l) {
            return (l.title.toLowerCase() === this.config.floodlevelGroupLayerName.toLowerCase());
          }.bind(this));
          // console.log(this.floodlevelsGroupLayer);

          this.view.whenLayerView(this.buildingLayer).then(function(lv){
            this.buildingLayerView = lv;
          }.bind(this));

          this.processFloodLevelChange();

        }.bind(this));

        
 

      dojoOn(
        dom.byId("btnDecreaseFloodLevel"),"click", function() {
          this.floodSliderValue--;
          if (this.floodSliderValue < -1 ) {
            dom.byId("btnDecreaseFloodLevel").disabled = true;
            dom.byId("btnIncreaseFloodLevel").disabled = false;
            this.floodSliderValue = -1;
          } else if (this.floodSliderValue === -1 ) {
            dom.byId("btnDecreaseFloodLevel").disabled = true;
            dom.byId("btnIncreaseFloodLevel").disabled = false;
          } else {
            dom.byId("btnDecreaseFloodLevel").disabled = false;
            dom.byId("btnIncreaseFloodLevel").disabled = false;
          }

          if (this.floodSliderValue === -1){
            dom.byId(SLRSliderMessage).innerHTML = this.config.flood_risk_name + ": " + "no flooding";
          }
          else{
            dom.byId(SLRSliderMessage).innerHTML = this.config.flood_risk_name + ": " + this.floodSliderValue + " " + this.config.flood_unit;
          }

          this.processFloodLevelChange();
        }.bind(this)
      );
      dojoOn(
        dom.byId("btnIncreaseFloodLevel"),"click", function() {
          this.floodSliderValue++;
          if (this.floodSliderValue > 6 ) {
            dom.byId("btnIncreaseFloodLevel").disabled = true;
            dom.byId("btnDecreaseFloodLevel").disabled = false;
            this.floodSliderValue = 6;
          } else if (this.floodSliderValue === 6 ) {
            dom.byId("btnIncreaseFloodLevel").disabled = true;
            dom.byId("btnDecreaseFloodLevel").disabled = false;
            
          } else {
            dom.byId("btnIncreaseFloodLevel").disabled = false;
            dom.byId("btnDecreaseFloodLevel").disabled = false;
          }

          if (this.floodSliderValue === -1){
            dom.byId(SLRSliderMessage).innerHTML = this.config.flood_risk_name + ": " + "no flooding";
          }
          else{
            dom.byId(SLRSliderMessage).innerHTML = this.config.flood_risk_name + ": " + this.floodSliderValue + " " + this.config.flood_unit;
          }

          this.processFloodLevelChange();
        }.bind(this)
      );
      // dojoOn(dom.byId("btnAffectedProperties"), "click", function () {
      //   this.generateCharts("Usage", "count");
      // }.bind(this));

    },

    processFloodLevelChange: function() {
      this.renderBuildings();
      var whereClause = this.config.flood_risk + this.config.level_name + " <= " + this.floodSliderValue ;
      this.updateDashBoard(whereClause);
      this.generateCharts("Usage", "count");
    },

    renderBuildings: function() {
      // console.log(this.floodSliderValue);
      var HIGHTLIGHTED = "#FF0000";
      var NOT_HIGHTLIGHTED = "#FFFFFF";
            
      // Create the renderer and configure visual variables      
      this.buildingLayer.renderer = new SimpleRenderer({
        symbol: {
          type: "mesh-3d",
          symbolLayers: [
            {
              type: "fill",
              material: {
                color: "#ffffff",
                colorMixMode: "replace"
              },
              edges: {
                type: "solid", // autocasts as new SolidEdges3D()
                color: [50, 50, 50, 0.5],
                size: 1
              }
            }
          ]
        },
        visualVariables: [
          {
            // Set Opacity
            // specifies a visual variable of continuous color
            type: "color",
            field: this.config.flood_risk + this.config.level_name,
            // Color ramp from white to red buildings impacted by SLR will be
            // assigned a color proportional to the min and max colors specified below
            // Values for Sea LevelRise SliderSlider for Sea Level Rise
            // Slider for Sea Level Rise
            stops: [
              {
                value: null,
                color: NOT_HIGHTLIGHTED
              },
              {
                value: 0,
                color:  this.floodSliderValue >= 0 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              },
              {
                value: 1,
                color:  this.floodSliderValue >= 1 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              },
              {
                value: 2,
                color:  this.floodSliderValue >= 2 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              },
              {
                value: 3,
                color:  this.floodSliderValue >= 3 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              },
              {
                value: 4,
                color:  this.floodSliderValue >= 4 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              },
              {
                value: 5,
                color:  this.floodSliderValue >= 5 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              },
              {
                value: 6,
                color:  this.floodSliderValue >= 6 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
              }
            ]
          }
        ]
      });

      // Update FloodLayer
      this.floodlevelsGroupLayer.layers.forEach(function(e, i) {
        e.opacity = i ===  this.floodSliderValue ? 1 : 0;        
      }.bind(this));

      // Update UI
      // html.set(
      //   dom.byId("SLRSliderMessage"),
      //   "Sea Level Rise : " + floodSliderValue + "ft"
      // );
    },

    updateDashBoard: function(whereClause) {
      var fldName = this.config.OIDname;
      
      if (this.floodSliderValue === -1){
        dom.byId("affectedBuildings").innerHTML = "";
      }
      else{
        this.querySubCategoriesCount("Count", this.buildingLayer, fldName, whereClause).then(function(results) {
            dom.byId("affectedBuildings").innerHTML = results.features.length;           
          });
      }

      //var whereClause = this.config.flood_risk + this.config.level_name + " <= " + this.floodSliderValue ;
      var fldName = this.config.flood_risk + this.floodSliderValue + this.config.damage_name;

      if (this.floodSliderValue === -1){
        dom.byId("damage").innerHTML = "";
      }
      else{
        this.querySubCategoriesSum("sum", this.buildingLayer, fldName, whereClause).then(function(results) {
          dom.byId("damage").innerHTML = this.config.damage_unit + Math.floor(results);
        }.bind(this));
      }

      fldName = this.config.flood_risk + this.floodSliderValue + this.config.exposure;

      if (this.floodSliderValue === -1){
        dom.byId("exposure").innerHTML = ""
      }
      else{
        this.querySubCategoriesSum("sum", this.buildingLayer, fldName, whereClause).then(function(results) {
          dom.byId("exposure").innerHTML = results + " square " + this.config.flood_unit;
        }.bind(this));
      }
    },

    generateCharts:function(fldName, stat ) {
      var whereClause = this.config.flood_risk + this.config.level_name + " <= " + this.floodSliderValue ;
      this.querySubCategoriesCount("Count", this.buildingLayer, fldName, whereClause).then(function(qryResults) {
        console.log(qryResults);
        
        var results = qryResults.features.map(obj => [
          obj.attributes[fldName],
          obj.attributes["Count"]
        ]);

        var chartdata=[];
        
       
        for ( var i=0; i < results.length; i ++) {
          var obj = {};
          obj[fldName] = results[i][0];
          obj[stat] = results[i][1];
          //obj["color"] = this.config.colorRamp1[i];
          chartdata.push(obj);
        }
        this.showPieChart(this.floodSliderValue, this.buildingLayer,chartdata, fldName, stat );
      }.bind(this));
    },

    showPieChart: function(floodSliderValue, buildingLayer, chartData, fldName, stat ){
      // Themes begin
      am4core.useTheme(am4themes_animated);
      // Themes end

      var chart = am4core.create("chartdiv", am4charts.PieChart);
      //chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

     // chart.legend = new am4charts.Legend();

      chart.data = chartData; 
      chart.fontSize = 10;
      chart.chartcursor = false;
      var series = chart.series.push(new am4charts.PieSeries());
      series.dataFields.value = stat;
      series.dataFields.category = fldName;
      series.slices.template.stroke = am4core.color("#fff");
      series.slices.template.strokeWidth = 2;
      series.slices.template.strokeOpacity = 1;
      series.slices.template.tooltipText="";

      // This creates initial animation
      series.hiddenState.properties.opacity = 1;
      series.hiddenState.properties.endAngle = -90;
      series.hiddenState.properties.startAngle = -90;

      


      //HOVER
      // series.slices.template.events.on("over", function(ev) {       
      //     this.handleEvents("pie", ev, true);        
      // }.bind(this));

      series.slices.template.events.on("hit", function(ev) {       
        this.handleEvents("pie", ev, true);        
    }.bind(this));

      //MOVE OUT
    //   series.slices.template.events.on("out", function(ev) {       
    //     this.handleEvents("pie", ev, false);        
    // }.bind(this));

    },

    handleEvents:function(chartType, ev, flg){
      // console.log(ev);
      // console.log(ev.target.dataItem.component.isActive);

      var selSlices = "";
      var series = ev.target.dataItem.component;
      series.slices.each(function(item) {
        if (item.isActive) {
          //item.isActive = false;
          console.log(item);
          selSlices += "'" + item.dataItem.category + "',";
        }
      });
      //remove last comma
      selSlices = selSlices.slice(0,-1);

      if (flg) {        
        let query = new Query();
        query.returnGeometry = true;
        query.outFields = "*";
        
        if (selSlices === "") {
          query.where = this.config.flood_risk + this.config.level_name + " <= " + this.floodSliderValue ;
        }else {
          // at least one slice selected
          query.where = "Usage IN (" + selSlices + ") AND " + this.config.flood_risk + this.config.level_name + " <= " + this.floodSliderValue ;
        }
        
        this.buildingLayer.queryFeatures(query).then(function(result){
          if (this.highlight) {
            this.highlight.remove();
          }
          if (selSlices === "") {
            // if no slices selected
            this.highlight.remove();
          } else {
            this.highlight = this.buildingLayerView.highlight(result.features);
          }         
          
          this.updateDashBoard(query.where);
        }.bind(this));
      } 
    },

    querySubCategoriesCount: function(statType, featLayer, field, qryWhere) {
      var statisticDefinition = new StatisticDefinition({
        statisticType: statType,
        onStatisticField: field,
        outStatisticFieldName: statType
      });

      let qry = new Query();
      qry.outStatistics = [statisticDefinition];
      qry.where = qryWhere;
      qry.groupByFieldsForStatistics = [field];
      qry.orderByFields = [field];

      return featLayer.queryFeatures(qry).then(function(result) {
        console.log(result);
        return result;
        // return result.features.map(obj => [
        //   obj.attributes[field],
        //   obj.attributes[statType]
        // ]);
      });
    },

    querySubCategoriesSum: function(statType, featLayer, field, qryWhere) {
      var sumPopulation = {
        onStatisticField: field,  
        outStatisticFieldName: statType,
        statisticType: statType
      }
      var query = featLayer.createQuery();
      query.where = qryWhere;
      query.outStatistics = [ sumPopulation ];
      return featLayer.queryFeatures(query)
        .then(function(response){
           var stats = response.features[0].attributes;
          //  console.log("output stats:" + stats);
           return stats["sum"];
        });

     
    },

    // updateOverviewExtent:function() {
    //   // Update the overview extent by converting the SceneView extent to the
    //   // MapView screen coordinates and updating the extentDiv position.
    //   var extentDiv = dom.byId("extentDiv");

    //   var extent = this.view.extent;

    //   var bottomLeft = this.mapView.toScreen(extent.xmin, extent.ymin);
    //   var topRight = this.mapView.toScreen(extent.xmax, extent.ymax);

    //   extentDiv.style.top = topRight.y + "px";
    //   extentDiv.style.left = bottomLeft.x + "px";

    //   extentDiv.style.height = (bottomLeft.y - topRight.y) + "px";
    //   extentDiv.style.width = (topRight.x - bottomLeft.x) + "px";
    // },

    updateOverview:function() {
      // Animate the MapView to a zoomed-out scale so we get a nice overview.
      // We use the "progress" callback of the goTo promise to update
      // the overview extent while animating
      this.mapView.goTo({
        center: this.view.center,
        scale: this.view.scale * 2 * Math.max(this.view.width /
          this.mapView.width,
          this.view.height / this.mapView.height)
      }.bind(this));
    }

    

  };
});

