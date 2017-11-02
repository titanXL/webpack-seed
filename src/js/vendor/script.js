var Snap = require('./snapper/snapper');
// On ajax update functions

    // Handles JSONML format, see: http://www.jsonml.org/
	var onAjaxUpdate = function(data) {
		var nodesToUpdate = $(".subject-to-updates");
		for(var i = 0; i < nodesToUpdate.length && i < data.length; i++) {
			$(nodesToUpdate[i]).empty();
			generateAjaxContent(nodesToUpdate[i], data[i], 0);
		}
	}

	var generateAjaxContent = function(parent, data, level) {
		var el = parent;
		if(level > 0) {
			el = document.createElement(data[0]);
			parent.appendChild(el);
		}
		for(var i = 1; i < data.length; i++) {
			if(data[i].constructor === Array) {
				generateAjaxContent(el, data[i], 1 + level);
			} else
			if(typeof data[i] === 'object') {
				setAjaxAttributes(el, data[i]);
			} else
			if(typeof data[i] === 'string') {
				el.appendChild(document.createTextNode(data[i]));
			}
		}
	}

	var setAjaxAttributes = function(el, obj) {
		for(name in obj) {
			el.setAttribute(name, obj[name]);
		}
	}

    // Register Event Listener
        var addEvent = function addEvent(element, eventName, func) {
            if (element.addEventListener) {
                return element.addEventListener(eventName, func, false);
            } else if (element.attachEvent) {
                return element.attachEvent("on" + eventName, func);
            }
        };

/*------------------------------------------------------------------
[  Snapper JS ]
*/

    // Init Navbar
    var snapper = new Snap({
        element : document.getElementById('rightColumn'),
        disable: 'right',
        tapToClose: false,
        touchToDrag : false,
        easing: 'ease'
    });
    console.log(snapper)
    // Sanpper On Resize
    var snap = document.getElementById('leftColumn');

    if(snap)
        snapper.open('left');
    $( window ).resize(function() {
        if ($( window ).width() > 991 && snap)
            snapper.open('left',"sidebar");
        else
            snapper.close("sidebar");
    });

    // Toggle Navbar
    addEvent(document.getElementById('open-left'), 'click', function(){
        var data = snapper.state();
        if(data.state == "closed")
            snapper.open('left');
        if(data.state == "left")
            snapper.close();
    });

/*------------------------------------------------------------------
[  Dynamic Form and Typeahead ]
    */
    var dynamicForm = {},
        checker = "";

    /**
     * changePatial
     * @param  {String} selected
     * @param  {String} formID
     */
    dynamicForm.changePatial = function(selected,formID){
        $(".partial").each(function(k,partial){
            if($(this).hasClass(selected)){
                $(this).removeClass("hidden")
                    .find('*').filter(':input').each(function(k,val){
                    $(val).prop({
                        'disabled': false,
                        'required': true,
                    }).removeClass('hidden');
                })

            if ( $(this).has('input:required')) {
                    checker = 1;
                }

            }else{
                $(this).addClass("hidden")
                    .find('*').filter(':input').each(function(k,val){
                    $(val).prop({
                        'disabled': true,
                        'required': false,
                    }).addClass('hidden');
                })
            }
        });
    }

    /**
     * hidePartials
     * @param  {String} exception
     */
    dynamicForm.hidePartials = function(exception) {
        $(".partial").each(function(k,partial){
            if(partial != exception)
            {
                $(this).addClass("hidden");
                $(this).find('*').filter(':input').each(function(k,val){
                    $(val).prop('required',false);
                    $(val).prop('disabled',true);
                    $(val).addClass('hidden');
                })
            }
        });
    }

    /**
     * handleSubmit
     * @param  {Event} e
     * @return {Bool}
     */
    dynamicForm.handleSubmit = function( e ){
        if(!$('button[type="submit"]').hasClass('disabled'))
            if( !confirm('Are you sure that you want to submit the form') )
                e.preventDefault();
        else
            return false;
    }

    /**
     * getSHA1 - Secure Hash
     * @param  {String} string - String for
     * @return {String} hash
     */
    dynamicForm.getSHA1 = function (string) {
        var hash = Sha1.hash(string, true).toUpperCase();
        return hash;
    }

    /**
     * handleLoginSubmit
     * @param  {Event}  e
     * @param  {Object} form
     * @return {Bool}
     */
    dynamicForm.handleLoginSubmit = function( e, form ){
        if(!$(form).find('button[type="submit"]').hasClass('disabled')){
            var password = $(form).find("[type='password']").val();
            $(form).find("[type='password']").val(dynamicForm.getSHA1(password));
        }
        else
            return false;
    }

    /**
     * On document ready
     */
    $(document).ready(function($) {

        $(document).on('change', "#rightColumn input:radio" , function () {
            $("input[name='"+$(this).attr("name")+"']").parent().removeClass('active');
            $(this)
                .parent().addClass('active')
        })

        // Handle all master dropdowns
        $(document).on('change', '.master', function(event) {
            dynamicForm.changePatial($(this).val());
            var oForm = $(this).closest('form');
            if (checker == 1) {
                oForm.validator("update").validator("validate");
            }
        })

        // Add IE 11 fix for select validation classes
        $(document).on('click', 'form[data-toggle="validator"] select[required]' , function(event) {
            event.preventDefault();
            var $el = $(this);

            var matchValue = "";
            if ($el.val() == matchValue) {
                $el.closest('.form-group').addClass('has-error has-danger');
                if(!$el.hasClass('master')){
                	$el.trigger('change');
                }
            }else{
                $el.closest('.form-group').removeClass('has-error has-danger');
                if(!$el.hasClass('master')){
                	$el.trigger('change');
                }
            }
        });

        // Trigger change at least once
        if($(".master").length > 0){
            $(".master").trigger("change");
        }

        if($("#suggest").length > 0){
 			/**
             * getDynamicTranslations - translations map
             * @type {[type]}
             */
            var getDynamicTranslations = $("#clientTranslation").val(),
            	transArray = (getDynamicTranslations) ? getDynamicTranslations.split(",") : undefined,
                trans = {
                    "companyID"  : (transArray) ? transArray[0] : $("#clientIdLabel").val(),
                    "company"    : (transArray) ? transArray[1] : $("#companyLabel").val(),
                    "companyLON" : (transArray) ? transArray[2] : $("#companyLonLabel").val()
                },
             saveQuery = "";

            /**
             * Typehead
             * @param  {[type]} source
             * @param  {[type]} query
             * @param  {Array}  process
             * @param  {[type]} minLength:    3
             * @param  {[type]} autoSelect:   false
             * @param  {[type]} delay    :    1000
             * @param  {[type]} fitToElement: true
             * @param  {[type]} highlighter:  function
             * @return {[type]}               [description]
             */
            var suggestInput = $("#suggest"),
                urlparamname = suggestInput.data('urlparamname') || 'id',
                itemFieldName = (urlparamname == 'id') ? 'companyID' : 'username';
            suggestInput.typeahead({
                source: function(query,process){

                    var companies = [],
                        contextPath = $("#context-path").val() || false;

                    if(!contextPath){
                        return false;
                    }

                    // Append Loader
                    suggestInput.parent().find(".form-control-loader").toggleClass("hidden");

                    // Sage Query for additional use
                    saveQuery = query;
                    jQuery.ajax({
                        url: contextPath + '/secure/common/client-list-autocomplete?' + urlparamname + '=' + query,
                        type: 'GET'
                    })
                    .done(function(data) {
                    	suggestInput.parent().find(".form-control-loader").toggleClass("hidden");
                        process(data);
                    })
                    .fail(function(data) {
                        console.log("Data failed.");
                    })
                    .always(function() {
                    });

                },
                minLength: 3,
                autoSelect: false,
                delay : 1000,
                fitToElement: true,
                afterSelect : function(item){
                    if ($("#suggest-check")) {
                        $("#suggest-check").val(item);
                        $("#suggest-check").closest('form').validator('update').validator('validate');
                    }
                },
                highlighter: function (item) {
                	var itemObject = JSON.parse(item);
                    var html = "",
                        companyID = itemObject.companyID.replace(new RegExp('(' + saveQuery + ')', 'ig'), function ($1, match) {
                            return '<strong>' + match + '</strong>';
                        });
                    html = '<div class="typeahead">';
                    html +=    '    <div class="col-md-12 no-padding" style="border-bottom:1px dashed #ccc">';
                    html +=    '        <label><small>'+trans.company+ '</small>'+ itemObject.company +'</label>';
                    html +=    '        <p><small class="pull-left">'+ trans.companyID + ':&nbsp;&nbsp;' + companyID + '</small><small class="pull-right">'+trans.companyLON+ ':<strong>&nbsp;&nbsp;' + itemObject.hasLON +'</strong></small></p>';
                    html +=    '    </div>';
                    html +=    '<div class="clearfix"></div>';
                    html += '</div>';
                    return html;
                },
                updater : function (item) {
                    $("#rawId").val(item.id);
                    return item[itemFieldName];
                },
                matcher: function(item) {
                	return item[itemFieldName].indexOf(saveQuery) != -1;
                },
                displayText: function(item) {
                	if (typeof (item) != "object") {
                		return item;
                	}
                	return JSON.stringify(item);
                }
            })
        };

        // Suggest Company for Monitoring
        if($("#suggest-monitoring-company").length > 0){

            var saveQuery = "";

            /**
             * Typehead
             * @param  {[type]} source
             * @param  {[type]} query
             * @param  {Array}  process
             * @param  {[type]} minLength:    3
             * @param  {[type]} autoSelect:   false
             * @param  {[type]} delay    :    1000
             * @param  {[type]} fitToElement: true
             * @param  {[type]} highlighter:  function
             * @return {[type]}               [description]
             */
            $('#suggest-monitoring-company').typeahead({
                source: function(query,process){

                    var companies = [],
                        contextPath = $("#context-path").val() || false;

                    if(!contextPath)
                        return false;

                    $("#suggest-monitoring-company").parent().find(".form-control-loader").toggleClass("hidden");

                    saveQuery = query;
                    jQuery.ajax({
                        url: contextPath + '/secure/common/company-list-autocomplete?fnr=' + query,
                        type: 'GET'
                    })
                    .done(function(data) {
                        $(self).parent().find(".form-control-loader").toggleClass("hidden");
                        process(data);
                    })
                    .fail(function(data) {
                        console.log("Data failed.");
                    })
                    .always(function() {
                    });

                },
                minLength: 3,
                autoSelect: false,
                delay : 1000,
                fitToElement: true,
                highlighter: function (item) {
                	var itemObject = JSON.parse(item);
                    var html = "";
                    html = '<div class="typeahead">';
                    html +=    '    <div class="col-md-12 no-padding" style="border-bottom:1px dashed #ccc">';
                    html +=    '        <p><small class="pull-left">' + itemObject.companyName + '</small><small class="pull-right"><strong>'
                                        + itemObject.legalType +'</strong></small><br>';
                    html +=    '        <small class="pull-left"><i>'+ itemObject.companyStatus + '</i></small></p>';
                    html +=    '    </div>';
                    html +=    '<div class="clearfix"></div>';
                    html += '</div>';
                    return html;
                },
                updater : function (item) {
                    $("#experianId").val(item.expnId);
                    return item.companyName;
                },
                matcher: function(item) {
                	return item.fnr.indexOf(saveQuery) != -1;
                },
                displayText: function(item) {
                	if (typeof (item) != "object") {
                		return item;
                	}

                	return JSON.stringify(item);
                }
            })
        };
    });

/*------------------------------------------------------------------
[  Modals: EditRecord, Delete & DeleteAll  ]
*/
    $(document).ready(function($) {

        // Edit Modal
        if($("#editRecord").length > 0){

            $('#editRecord').on('show.bs.modal', function (event) {
              var button    = $(event.relatedTarget),
                    row     = button.data('row'),
                    modal   = $(this);
              modal
                .find('.fnr label').text( row.fnr ).end()
                .find('.modal-title strong').text(row.companyName).end()
                .find("input[name='fnr']").val(row.fnr).end()
                .find("input[name='expnId']").val(row.expnId).end()
                .find("input[name='customerId']" ).val( row.customerId );
                $('#editFNR').validator('validate');
            })
        }

        // Delete Item Modal
        if($("#delete").length > 0){
            $('#delete').on('show.bs.modal', function (event) {
                var button  = $(event.relatedTarget),
                    row     = button.data('row'),
                    modal   = $(this);
                if (row.id != -1) {
                    $('#deleteModalLabel').removeClass( "hidden" );
                    $('#deleteAllModalLabel').addClass( "hidden" );
                    modal
                        .find('input[name="expnId"]').val(row.expnId).end()
                        .find('.companyName label').text( row.companyName ).end()
                        .find('.fnr label').text( row.fnr ).end()
                        .find('.customerId label').text( row.customerId ).end()
                        .find('.companyDetails').removeClass( "hidden" ).end();
                } else {
                    $('#deleteModalLabel').addClass( "hidden" );
                    $('#deleteAllModalLabel').removeClass( "hidden" );
                    modal
                        .find('input[type="hidden"]').val( row.id ).end()
                        .find('.companyDetails').addClass( "hidden" ).end();
                };
            })
        }

    });

/*------------------------------------------------------------------
[  Fake file input (Blame IE) and Fakepath fix ]
*/
    $(document).ready(function($) {

        // Fake file input to style Input & Fakepath fix
        if( $(".fake-file-info").length > 0 ){
            // Custom file upload
            $('input:file').on('change', function(event) {
                $('.fake-file-info').val($(this).val().replace(/.*[\/\\]/, ''));
                $(this).closest('form').validator('validate');
            });

            $('.fake-file-info').on('click', function(event) {
                $('input:file').trigger('click');
            });
        }

    });

/*------------------------------------------------------------------
[   Check All / Uncheck All button functionality   ]
*/
    $(document).ready(function($) {

        // Check All and Uncheck All button
        if( $("#checkAll").length > 0 ){

            $(document).on("click", "#checkAll, #uncheckAll", function(event) {
                 if ($(this).is('#checkAll'))    {
                    $(this).addClass('hidden');
                    $("#uncheckAll").removeClass('hidden');
                    $('#checkable').children("option").prop('selected', true);
                };
                if ($(this).is('#uncheckAll'))  {
                    $(this).addClass('hidden');
                    $("#checkAll").removeClass('hidden');
                    $('#checkable').children("option").prop('selected', false);
                }
            });
        }

    });

/*------------------------------------------------------------------
[  Pagination Starts Here  ]
*/
    // Default current page value
    var currentPage = parseInt($("#currentDataPage").val()) || 1;

    /**
     * Renders pagination links as unordered list elements
     * @param {Number} starting
     * @param {Number} ending
     * @param {Sting} active
     * @return {String} content
     */
    function addPages(starting, ending, active, totalPages, className) {
        var selectorClass = (className) ? "." + className : "";
        var startText = $(selectorClass + ".startButton").text();
        var endText = $(selectorClass + ".endButton").text();

        if (active == 1 ) {
            var content = " ";
        } else {
            var content = "<li class='start'><a href='?page=" + 1 + "' aria-label='" + startText + "' class='addLoader'>" + startText + "</a></li><li class='prev'><a href='?page=" + (active - 1) + "' aria-label='Previous' class='addLoader'>&laquo;</a></li>";
        }
        for (var i = starting; i <= ending; i++) {
            content += "<li class='page"+ ((i == active) ? " active " : "") +"'><a href='?page=" + i + "' class='addLoader'>" + i + "</a></li>";
        }


        if (active != totalPages) {
            content += "<li class='next'><a href='?page=" + (active + 1) + "' aria-label='Next' class='addLoader'>&raquo;</a></li><li class='end'><a href='?page=" + totalPages + "' aria-label='" + endText + "'  class='addLoader'>" + endText + "</a></li>";
        }

        return content;
    }

    /**
     * Builds Pagination according to params values
     * @param {Number} totalPages
     * @param {Number} showRange
     * @param {Number} currentPage
     * @return {Bool|String} content = false | html string
     */
    function buildPagination(totalPages, showRange, currentPage)  {
    //      || showRange > totalPages
        if (totalPages <= 0  || !showRange) {
            return false;
        } else if (totalPages == 1) {
            content = "";
        } else {
            if (totalPages < showRange * 2) {
                content = addPages(1, totalPages, currentPage, totalPages);
            }
            else if (currentPage < showRange * 2) {
                content = addPages(1, showRange * 2, currentPage, totalPages);
            }
            else if (currentPage > totalPages - showRange * 2) {
                content = addPages(totalPages - showRange * 2, totalPages, currentPage, totalPages);
            }
            else {
                content = addPages(currentPage - showRange, currentPage + showRange, currentPage, totalPages);
            }
        }

        $(".pagination").html(content);
    }


    /**
        * Обира дадени параметри и връща стринг с &
        * @param {Object} oParams - параметрите в обект
        */
    function getRequestBody(oParams)   {
        var aParams = new Array(),
            sParam;
        $.each(oParams,function(j,valR){
            sParam = "";
            sParam = encodeURIComponent(j);
                sParam += "=";
                sParam += encodeURIComponent(valR);
                aParams.push(sParam);
        });

        return aParams.join("&");
    }

    function getContent(currentPage){

        // var timer;
        // $('#pages').html('Waiting…');

        var ajaxtUrl = window.location.href.split("?")[0];

        // Ajax Get Data
        jQuery.ajax({

            beforeSend: function (xhr){ 
                xhr.setRequestHeader("Content-Type","application/json");
                xhr.setRequestHeader("Accept","application/json");
        // xhr.setRequestHeader("Accept","text/json");
            },
            url: ajaxtUrl + '?page=' + currentPage,
            type: 'GET',
            contentType: "application/json"
        })
        .done(function(data) {
        	//console.log(data);
        	onAjaxUpdate(data);

            // Remove loader
        	$("#loader").remove();

            // Loop through and push to the array
            // $.each(data, function (i, e) {
            // companies.push(e.companyID + "|" + e.company + "|" + e.hasLON);
            // });
            //
            // // Remove loader
            // $(self).parent().find(".form-control-loader").toggleClass("hidden");
            //
            // // Process the details
            // process(companies);
        })
        .fail(function(data) {
            console.log("fails",data);
        })
        .always(function() {
        });

        // var promise = process();
        // promise.done(function(data) {
        //      var root = 'https://jsonplaceholder.typicode.com';
        //         $.ajax({
        //           url: root + '/posts/' + currentPage,
        //           method: 'GET'
        //         }).then(function(data) {
        //             $("#pages").html("<h1>" + data.title + "</h1>").append("<p>" + data.body + "</p>");
        //         });
        // });
        // promise.progress(function() {
        //     $('#pages').html($('#pages').html() + '.');
        // });

        // function process() {
        //   var deferred = $.Deferred();

        //   timer = setInterval(function() {
        //     deferred.notify();
        //   }, 1000);

        //   setTimeout(function() {
        //      clearInterval(timer);
        //      deferred.resolve();
        //   }, 3000);

        //   return deferred.promise();

        // }
    }

    $(document).ready(function() {

        if( $(".pagination").length > 0 ){

            // Get from backEnd
            var totalPages = $("#totalDataPages").val() || 1;
            var showRange = 3;

            // Make all values Integer, decimal
            totalPages = parseInt(totalPages, 10);
            showRange = parseInt(showRange, 10);

            var params      = window.location.search.replace("?",""),
                newParams   = {},
                tempParams  = {};

                params = params.split("&").map(function(val) {
                    val                 = val.split("=");
                    tempParams          = {};
                    tempParams[val[0]]  = val[1];

                    $.extend(true, newParams, tempParams);
                });

                // if (!newParams.page) {
                //     if ($.isEmptyObject(newParams)) {
                //         window.location.href = window.location.href + "?page=1";
                //     } else {
                //         window.location.href = window.location.href + "&page=1";
                //     }
                // }

            if (newParams.page > 0) {
                currentPage = parseInt(newParams.page);
                if(parseInt(newParams.page) > totalPages) { currentPage = totalPages; };
            }

            // on click rebuild pagination
            $(".pagination").on("click", "li.page,.prev,.next,.start,.end", function(event) {

                // don't reload page on click
                event.preventDefault();

                if($(this).is('li.page')){
                    currentPage = parseInt($(this).text());
                }
                if($(this).is('.prev')){
                    currentPage--;
                    if (currentPage < 1) { currentPage = 1; };
                }
                if($(this).is('.next')){
                    currentPage++;
                    if (currentPage > totalPages) { currentPage = totalPages; };
                }
                if($(this).is('.start')){
                   currentPage = 1;
                }
                if($(this).is('.end')){
                    currentPage = totalPages;
                }
                getContent(currentPage);

                //Split URL to check if there are more than one params
                var newUrl = window.location.href.split("&")[1];

                if (newUrl) {
                    newParams.page = currentPage;
                    var paramsUrl = getRequestBody(newParams);
                    newUrl = window.location.href.split("?")[0] + "?" + paramsUrl;
                } else {
                    newUrl =  window.location.href.split("?")[0] + "?page=" + currentPage;
                }

	            // Change page number in url and push it to history
	            history.pushState(currentPage, null, newUrl);
	            buildPagination(totalPages, showRange, currentPage);
	        });

	        // History events handled
	        window.addEventListener('popstate', function(e){
	            currentPage = e.state;
	            buildPagination(totalPages, showRange, currentPage);
	        });

            // Init pagination links
	        // getContent(currentPage);
	        buildPagination(totalPages, showRange, currentPage);

        }
    });

/*------------------------------------------------------------------
[  Loader & Cloak loader  ]
*/
    $(document).ready(function($) {
        if ($(".addLoader").length > 0) {
            // Add loader to the innermost element to make IE happy
            $(document).on("click", ".addLoader", function(event) {

                if (!$(this).hasClass('disabled')) {
                     $("body").prepend('<div id="loader"></div>');
                }

            });

        }


        if ($(".loadcloak").length > 0 && $(".loadcloak").is(':visible')) {


            $(".loadcloak").addClass('hidden');

        }

    });

/*------------------------------------------------------------------
[  Back to top button functionality  ]
*/
    $(document).ready(function(){

        if ($(".scroll-top-wrapper").length > 0) {
            $(function(){

                $("#rightColumn").on( 'scroll', function(){
                    if ($("#rightColumn").scrollTop() > 100) {
                        $('.scroll-top-wrapper').addClass('show');
                    } else {
                        $('.scroll-top-wrapper').removeClass('show');
                    }
                });

                $('.scroll-top-wrapper').on('click', scrollToTop);
            });

            function scrollToTop() {
                element = $('#rightColumn');
                offset = element.offset();
                // Substract the value of margin-top added in CSS to #rightColumn
                offsetTop = offset.top - 56;
                $('#rightColumn').animate({scrollTop: offsetTop}, 500, 'linear');
            }
        }

    });