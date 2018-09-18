$(document).on("click", "#addBtn", function () {
    $("#notes").empty();
    var thisId = $(this).attr("data-id");

    $.ajax({
            method: "GET",
            url: "/articles/" + thisId
        })
        .then(function (data) {
            console.log(data);
            $("#notes").append("<h2>" + data.title + "</h2>");
            $("#notes").append("<input id='titleinput' name='title' >");
            $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
            $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
            $('#notes').show();
            // If there's a note in the article
            if (data.note) {
                $("#titleinput").val(data.note.title);
                $("#bodyinput").val(data.note.body);
            }
        });
});


$(document).on("click", "#savenote", function () {
    var thisId = $(this).attr("data-id");
    $.ajax({
            method: "POST",
            url: "/articles/" + thisId,
            data: {
                title: $("#titleinput").val(),
                body: $("#bodyinput").val()
            }
        })
        .then(function (data) {
            $("#notes").empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
});

$(document).on("click", "#delBtn", function () {
    var thisId = $(this).attr("data-id");
    var articleId = $(this).attr("data-article");
    $.ajax({
            method: "POST",
            url: `/delete/${thisId}/${articleId}`,
        })
        .then(function (data) {
            console.log(data);
            if (data.note) {
                $("#titleinput").val(data.note.title);
                $("#bodyinput").val(data.note.body);
            }
            $("#notes").empty();
        });
});