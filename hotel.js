$(document).ready(function () {

  // Bootstrap DatePicker 
  $('#fromDate').datepicker({
    format: "dd/mm/yyyy"
  });
  $('#toDate').datepicker({
    format: "dd/mm/yyyy"
  });
  //  ------------

  //output
  let output = $("#results");

  //select all inputs
  let searchInput = $("#myInput");
  let searchSubmit = $("#search");
  let roomTypesDropDown = $("#roomTypes");
  let priceInput = $("#price");
  let propertyTypeDropDown = $("#propertyType");
  let ratingsDropDown = $("#ratings");
  let hotelLocationDropDown = $("#hotelLocation");
  let sortByDropDown = $("#sortBy");

  //array of input fields we need
  let allInputs = [
    searchInput,
    priceInput,
    propertyTypeDropDown,
    ratingsDropDown,
    hotelLocationDropDown,
    sortByDropDown
  ]

  //fill roomTypes dropdown & fill result with all data till something changes
  sendAjax((data) => {
    $.each(data[0].roomtypes, (i, type) => {
      roomTypesDropDown.append(new Option(type.name, i));
    });

    //find the more expensive hotel
    let highestPrice = Number.NEGATIVE_INFINITY;
    let tmp;
    for (var i = data[1].entries.length - 1; i >= 0; i--) {
      tmp = data[1].entries[i].price;
      if (tmp > highestPrice) highestPrice = tmp;
    }
    //set the maximum Price on range input
    priceInput.attr("max", highestPrice + 50);
    priceInput.attr("value", highestPrice + 50);
    $("#displaySelectedPrice").text(highestPrice + 50);
    //show all hotels
    showFinalResult(data[1].entries);
  });

  //add event listener (on change) to allInputs
  roomTypesDropDown.change(() => { alert("No data provided in json, so i have nothing to do here!") });

  $.each(allInputs, function (i, input) {
    input.change(inputChangeHandler);
  });

  //handler
  function inputChangeHandler(event) {

    let inputValues = getAllInputValues();
    $("#displaySelectedPrice").text(inputValues.maxPrice);
    sendAjax((data) => {

      let matchingEntries = [];

      $.each(data[1].entries, (i, entry) => {

        if ((inputValues.propertyType == entry.rating || inputValues.propertyType === "-1") &&
          (inputValues.rating === entry.ratings.text || inputValues.rating === "-1") &&
          (inputValues.city === entry.city || inputValues.city === "") &&
          (inputValues.maxPrice >= entry.price)) {

          matchingEntries.push(entry);
        }
      });

      if (inputValues.sortBy !== "-1") {
        //sort matchingEntries
        matchingEntries.sort((x, y) => {

          function hasFilter(entry) {
            for (let i = 0; i < entry.filters.length; i++) {
              if (entry.filters[i].name === inputValues.sortBy) {
                return true;
              }
            }
            return false;
          }
          let xHasFilter = hasFilter(x);
          let yHasFilter = hasFilter(y);

          if (xHasFilter === yHasFilter) {
            return 0;
          } else if (xHasFilter === true) {
            return -1;
          } else {
            return 1;
          }
        });
      }

      showFinalResult(matchingEntries);
    });
  }
  //------------

  // get the values of all inputs
  function getAllInputValues() {
    return {
      city: searchInput.val(),
      maxPrice: priceInput.val(),
      propertyType: propertyTypeDropDown.val(),
      rating: ratingsDropDown.val(),
      hotelLocation: hotelLocationDropDown.val(),
      sortBy: sortByDropDown.val()
    }
  }
  // send Ajax to data.json and choose what to do on success
  function sendAjax(successFunction) {
    $.ajax({
      url: "data.json",
      dataType: "json",
      success: successFunction,
      error: function (jqXHR, textStatus, errorThrown) {
        console.log('ERROR', textStatus, errorThrown);
      }
    });
  }
  //--------------

  // autocomplete on searchInput
  searchInput.focus(ajaxAutocomplete);

  function ajaxAutocomplete() {

    sendAjax(ajaxAutocompleteSuccess);

    // ajax Success
    function ajaxAutocompleteSuccess(data) {
      let cities = [];
      $.each(data[1].entries, (i, entry) => {
        if (cities.includes(entry.city) === false) {
          cities.push(entry.city);
        }
      });
      jQuery_ui('#myInput').autocomplete({ source: cities });
    }
  }
  // ------------------------

  //When Clicking on Search button, find all entries of the selected city and show them
  searchSubmit.click(function (e) {
    e.preventDefault();
    let city = searchInput.val();
    if (city === "" || city === null) {
      alert("Please insert a City!");
    } else {
      sendAjax(getEntriesFromCity);
      function getEntriesFromCity(data) {

        let hotelsWithSameCity = [];

        $.each(data[1].entries, (i, entry) => {
          if (city === entry.city) {
            hotelsWithSameCity.push(entry);
          }
        });
        if (hotelsWithSameCity.length > 0) {
          showFinalResult(hotelsWithSameCity);
        }
      }
    }
  });
  //--------------------

  //append an entry to output == $("#result")
  function showResult(entry) {

    let filters = entry.filters;
    let filterString = "";
    $.each(filters, (i, filter) => {
      filterString += filter.name + ", ";
    });
    let n = filterString.lastIndexOf(",");
    filterString = filterString.substring(0, n);

    let guestrating = entry.guestrating;
    let stringRating = ``;
    for (let i = 0; i < guestrating; i++) {
      stringRating += `<span class="fa fa-star checked"></span>`
    }

    let result = ` 
                  <div class="row bg-light">
                          <div class="col ">
                            <img src=`+ entry.thumbnail + ` max alt="thumbnail" class="img-thumbnail">
                          </div>
                          <div class="col-4 ">
                                <div>
                                  <h2> `+ entry.hotelName + `</h2>
                                </div>
                                  <span id="stars">
                                      `+ stringRating + `
                                  </span>
                                  <span> <strong>Hotel, `+ entry.city + `</strong> </span>
                                  <p>` + filterString + `</p>
                                  <span class="bg-success text-light"><strong> `+ entry.ratings.no + `</strong></span>
                                  <span><strong>`+ entry.ratings.text + `</strong></span>
                          </div>
                            <div class="offset-1 col-3">
                                  <div class="d-flex flex-column h-100 mt-4">
                                    <a href="#" class="mx-auto"><span class="text-center text-success">Hotel Website</span></a>
                                    <span class="display-3 text-success text-center">$`+ entry.price + `</span>
                                    <strong class="text-center">3 nights for <span class="text-center text-success">$`+ (entry.price * 3) + `</span>
                                    </strong>
                                    <button type="button" class="btn btn-success btn-lg">View Deal</button>
                                  </div>
                            </div>
                  </div>`

    output.append(result);
    $("#map").attr("src", entry.mapurl);
  }
  //---------------------
  //empty result div and append all selected entries
  function showFinalResult(entries) {
    output.empty();
    $.each(entries, (i, entry) => {
      showResult(entry);
    });
  }


});