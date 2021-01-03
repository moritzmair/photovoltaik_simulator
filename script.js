var water_temp = 20;
var battery = 0;
var max_photovoltaik;

var household_consumption_year;

var pointer = 0;

var electricity_cost = 0;
var electricity_revenue = 0;

var fast_simulation;
var fast_simulation_days = 30;

var total_photovoltaik = 0;
var total_household_consumption = 0;
var total_export = 0;
var total_import = 0;


var time_resolution = 15;

$( document ).ready(function() {
  // read in data files
  document.getElementById('photovoltaik').onchange = function(){
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function(progressEvent){
      console.log('file was read in');
      photovoltaik = this.result.split('\n').map(function (x) {
        return parseInt(x);
      });;
      max_photovoltaik = Math.max.apply(Math, photovoltaik);
    };
    reader.readAsText(file);
  };

  document.getElementById('household_consumption').onchange = function(){
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function(progressEvent){
      console.log('file was read in');
      household_consumption = this.result.split('\n');
    };
    reader.readAsText(file);
  };
});

function start_simulation(){
  fast_simulation = $('#fast_mode').is(":checked");

  household_consumption_year = parseInt($('input[name=household_consumption_kwh]').val());

  time_resolution = document.getElementById('time_resolution').value

  max_photovoltaik = Math.max.apply(Math, photovoltaik);

  year_consumption_household = household_consumption.reduce((pv, cv) => pv + cv, 0)/1000;
  photovoltaik_installed = $('input[name=photovoltaik_kwp]').val()*1000;

  consumption_factor = (year_consumption_household/ 60 * time_resolution) / household_consumption_year;
  photovoltaik_factor = photovoltaik_installed / max_photovoltaik;

  simulate_one_section();
}

function simulate_one_section(){

  current_usage = household_consumption[pointer] / consumption_factor;
  $('.meter_household_consumption > .text').html(Math.round(current_usage) + 'watt').css('height', (current_usage/1000*100)+'%');

  current_photovoltaik = photovoltaik[pointer] * photovoltaik_factor;

  $('.meter_photovoltaik_kwp > .text').html(current_photovoltaik + ' watt').css('height', (current_photovoltaik/photovoltaik_installed*100)+'%');

  // for fast simulation only simulate one day per month
  if(fast_simulation){
    if(Math.round(pointer/(24*60/time_resolution))%fast_simulation_days == 0){
      //simulate this day
      pointer++;
    }else{
      //skip next 30 days
      pointer = pointer + (24*60/time_resolution)*(fast_simulation_days-1);
    }
  }else{
    pointer++;
  }

  if(household_consumption[pointer] == undefined || photovoltaik[pointer] == undefined){
    end_simulation();
    return;
  }

  battery_max_size = $('input[name=battery_kwh]').val();
  water_storage_size = $('input[name=meter_water_qm]').val();

  current_need = current_photovoltaik - current_usage

  if (battery + current_need/1000 >= 0 && battery + current_need/1000 <= battery_max_size){
    battery = battery + current_need/1000;
    current_need = 0;
  }

  if(fast_simulation){
    fast_simulation_factor = fast_simulation_days;
  }else{
    fast_simulation_factor = 1;
  }

  total_photovoltaik = total_photovoltaik + (current_photovoltaik / 60 * time_resolution) * fast_simulation_factor;
  total_household_consumption = total_household_consumption + (current_usage / 60 * time_resolution) * fast_simulation_factor;

  if(current_need < 0){
    total_import = total_import + (current_need*-1 / 60 * time_resolution) * fast_simulation_factor;
    electricity_cost = electricity_cost + (current_need*-1 / 60 * time_resolution) * $('input[name=price_kwh]').val() * fast_simulation_factor / 1000;
    $('.meter_grid_kw_import > .text').html(Math.round(current_need) + ' Watt').css('height', (current_need*-1/100)+'%');
    $('.meter_grid_kw_export > .text').html(Math.round(current_need) + ' Watt').css('height', '0');
  }else{
    total_export = total_export + (current_need / 60 * time_resolution) * fast_simulation_factor;
    electricity_revenue = electricity_revenue + (current_need / 60 * time_resolution) * $('input[name=price_export_kwh]').val() * fast_simulation_factor / 1000;
    $('.meter_grid_kw_export > .text').html(Math.round(current_need) + ' Watt').css('height', (current_need/100)+'%');
    $('.meter_grid_kw_import > .text').html(Math.round(current_need) + ' Watt').css('height', '0');
  }

  $('input[name=total_elecritity_cost]').val(Math.round(electricity_cost));
  $('input[name=total_elecritity_revenue]').val(Math.round(electricity_revenue));

  $('.meter_battery_kwh > .text').html(Math.round(battery*10)/10 + ' kwh').css('height', (battery/battery_max_size*100)+'%');

  $('input[name=kw_passed]').val(parseInt(pointer/(24*60/time_resolution*7)));

  setTimeout(function(){ simulate_one_section(); },0);
}

function end_simulation(){
  console.log('ending simulation');
  $('.meter_grid_kw_import > .text').html('').css('height', 0);
  $('.meter_grid_kw_export > .text').html('').css('height', 0);
  $('.meter_household_consumption > .text').html('').css('height', 0);
  $('.meter_photovoltaik_kwp > .text').html('').css('height', 0);
  $('.meter_battery_kwh > .text').html('').css('height', 0);

  total_export_cost = $('input[name=total_elecritity_cost]').val();
  total_import_revenue = $('input[name=total_elecritity_revenue]').val();

  electricity_cost = 0;
  electricity_revenue = 0;



  pointer = 0;

  $('.results').append('<div class="one_result">Kosten: '+(total_export_cost-total_import_revenue)+' €<br>Photovoltaik: '+$('input[name=photovoltaik_kwp]').val()+' kWp<br>Stromspeicher: '+$('input[name=battery_kwh]').val()+' kWh<br>Stromverbrauch: '+$('input[name=household_consumption_kwh]').val()+' kWh<br>erzeugte kwh: '+ Math.round(total_photovoltaik/1000)+' kWh<br>verbrauchte kwh: '+ Math.round(total_household_consumption/1000)+' kWh<br>importierte kwh: '+ Math.round(total_import/1000)+' kWh<br>exportierte kwh: '+ Math.round(total_export/1000)+' kWh<br>Eigenberbrauchsanteil: '+Math.round(100-(total_export/total_photovoltaik*100))+'%</div>');

  total_photovoltaik = 0;
  total_household_consumption = 0;
  total_export = 0;
  total_import = 0;
}