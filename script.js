var water_temp = 20;
var battery = 0;
var max_photovoltaik;

var household_consumption_year;

var pointer = 0;

var electricity_cost = 0;
var electricity_revenue = 0;

var fast_simulation;


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

  consumption_factor = year_consumption_household / household_consumption_year;
  photovoltaik_factor = max_photovoltaik / photovoltaik_installed;

  simulate_one_section();
}

function simulate_one_section(){

  current_usage = household_consumption[pointer]/consumption_factor;
  $('.meter_household_consumption > .text').html(Math.round(current_usage) + 'watt').css('height', (current_usage/1000*100)+'%');

  current_photovoltaik = photovoltaik[pointer]/photovoltaik_factor;

  $('.meter_photovoltaik_kwp > .text').html(current_photovoltaik + ' watt').css('height', (current_photovoltaik/photovoltaik_installed*100)+'%');

  // for fast simulation only simulate one day per month
  if(fast_simulation){
    if(Math.round(pointer/(24*60/time_resolution))%30 == 0){
      //simulate this day
      pointer++;
    }else{
      //skip next 30 days
      pointer = pointer + (24*60/time_resolution)*29;
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

  current_need = (current_photovoltaik - current_usage ) / (60 * time_resolution)

  if (battery + current_need >= 0 && battery + current_need <= battery_max_size){
    battery = battery + current_need;
    current_need = 0;
  }

  if(current_need < 0){
    electricity_cost = electricity_cost + (current_need*-1) * $('input[name=price_kwh]').val() * (fast_simulation*30);
    $('.meter_grid_kw_import > .text').html(Math.round(current_need*1000) + ' Watt').css('height', (current_need*-1*100)+'%');
    $('.meter_grid_kw_export > .text').html(Math.round(current_need*1000) + ' Watt').css('height', '0');
  }else{
    electricity_revenue = electricity_revenue + current_need * $('input[name=price_export_kwh]').val() * (fast_simulation*30);
    $('.meter_grid_kw_export > .text').html(Math.round(current_need*1000) + ' Watt').css('height', (current_need/10*100)+'%');
    $('.meter_grid_kw_import > .text').html(Math.round(current_need*1000) + ' Watt').css('height', '0');
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

  $('.results').append('<div class="one_result">Kosten: '+(total_export_cost-total_import_revenue)+' €<br>Photovoltaik: '+$('input[name=photovoltaik_kwp]').val()+'<br>Stromspeicher: '+$('input[name=battery_kwh]').val()+'<br>Stromverbrauch: '+$('input[name=household_consumption_kwh]').val()+'</div>');
}