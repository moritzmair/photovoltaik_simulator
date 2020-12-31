var water_temp = 20;
var battery = 0;


$( document ).ready(function() {
  setInterval(function(){ simulate_one_minute(); }, 1000);
});

function simulate_one_minute(){
  current_usage = $('input[name=usage_kw]').val();
  max_photovoltaik = $('input[name=photovoltaik_kwp]').val();

  current_photovoltaik = max_photovoltaik;

  battery_max_size = $('input[name=battery_kwh]').val();
  water_storage_size = $('input[name=meter_water_qm]').val();

  battery = battery + (current_photovoltaik - current_usage ) / 60

  $('.meter_battery_kwh > .text').html(Math.round(battery*10)/10 + ' kwh')
}