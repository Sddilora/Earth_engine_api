var ee = require('@google/earthengine');

// Define study area
var TIGER = ee.FeatureCollection('TIGER/2018/Counties');
var region =  ee.Feature(TIGER
.filter(ee.Filter.eq('STATEFP', '17'))
.filter(ee.Filter.eq('NAME', 'Mclean')).first());
var geometry = region.geometry();
Map.centerObject(region);
Map.addLayer(region, {'color':'blue'}, 'McLean County');

//Import Landsat Imagery
var landsat7 = ee.ImageCollection('LANDSAT/LE07/CO2/T1_L2');
var landsat8 = ee.ImageCollection('LANDSAT/LE08/CO2/T1_L2');


// Functions to rename Landsat 7 and 8 images.
function renameL7(img){
  return img.rename(['BLUE', 'GREEN', 'RED', 'NIR', 'SWIR1',
  'SWIR2', 'TEMP1', 'ATMOS_OPACITY', 'QA_CLOUD', 'ATRAN', 
  'CDIST', 'DRAD', 'EMIS', 'EMSD', 'QA', 'TRAD', 'URAD',
  'QA_PIXEL', 'QA_RADSAT']);
}
function renameL8(img){
  return img.rename(['AEROS', 'BLUE', 'GREEN', 'RED', 'NIR', 'SWIR1',
  'SWIR2', 'TEMP1', 'QA_AEROSOL', 'ATRAN', 
  'CDIST', 'DRAD', 'EMIS', 'EMSD', 'QA', 'TRAD', 'URAD',
  'QA_PIXEL', 'QA_RADSAT']);
}

function addMask(img) {
 // Bit 0: Fill
 // Bit 1: Dilated Cloud
 // Bit 2: Cirrus
 // Bit 3: Cloud
 // Bit 4: Cloud Shadow
 // Bit 5: Snow
 // Bit 6: Clear
 // Bit 7: Water
 var clear = img.select('QA_PIXEL').bitwiseAnd(64).neq(0);
 clear = clear.updateMask(clear).rename(['pxqa_clear']);
  
 var water = img.select('QA_PIXEL').bitwiseAnd(128).neq(0);
 water = water.updateMask(clear).rename(['pxqa_water']);
   
 var cloud_shadow = img.select('QA_PIXEL').bitwiseAnd(16).neq(0);
 cloud_shadow = cloud_shadow.updateMask(clear).rename(['pxqa_cloudshadow']);
 
 var snow = img.select('QA_PIXEL').bitwiseAnd(32).neq(0);
 snow = snow.updateMask(clear).rename(['pxqa_snow']);
 
 var masks = ee.Image.cat([clear, water,
 cloud_shadow, snow]);
 
 return img.addBands(masks);
  
}

function maskQAClear(img) {
  return img.UpdateMask(img.select('pxqa_clear'));
}

// Green Chlorophyll Vegetation Index GCVI
// Function to add GCVI as a band.
function addVIs(img) {
  var gcvi = img.expression('(nir / green) - 1', {
    nir: img.select('NIR'),
    green: img.select('GREEN')
  }).select([0], ['GCVI']);
  
  return ee.Image.cat([img, gcvi]);
}

// Define study time period
var start_date = '2020-01-01';
var end_date = '2020-12-31';

// Pull Landsat 7 and 8 imagery over the study area between
// these dates
var landsat7coll = landsat7.filterBounds(geometry)
.filterDate(start_date, end_date).map(renameL7);

var landsat8coll = landsat8.filterBounds(geometry)
.filterDate(start_date, end_date).map(renameL8);

// Merge Landsat 7 and 8 collections.
var landsat = landsat7coll.merge(landsat8coll)
.sort('system:time_start');

// Mask out on-clear pixels, add VI, and time
landsat = ladsat.map(addMask)
.map(maskQAClear).map(addVIs);

// Visualzie GCVI time series at one location.
var point = ee.Geometry.Point([
  -88.81417685576481, 40.579804398254005]);
  
// var landsatChart = ui.Chart.image.series(
//   landsa.select('GCVI'), point)
//   .setChartType('ScatterChart')
//   .setOptions({
//     title:'Landsat GCVI time series',
//     lineWidth: 1,
//     pointSize: 3,
//   });
//    print(landsChart);

// Get crop type dataset.
var cdl = ee.Image('USDA/NASS/CDL/2020').select(['cropland'])
Map.addLayer(cdl.clip(geometry), {}, 'CDL2020');