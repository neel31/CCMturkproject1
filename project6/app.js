
var rows = 7;
var columns = 6;
var visibleRows = 6;
var cell_size = 50; 
var max_obstacles_per_row = 1;
var gameSpeed = 1000; 
var form_selector = "#mturk_form";

var board = [];

var top_row;
var ship_location = 0;
var gameboard;
var player;
var collective;
var counter;
var reward = 0;
var collectiveReward = 0;
var original_second;
var prev_second;
var update_interval;
var game_id;
var game_mode = 'median' ;

var group_key = "neel31"
var status = 'setup';

$("#start").click(function(e) {
    $(document).keydown(function(e) {
        if (e.keyCode == 37) { 
            move_player_left();
        } else if (e.keyCode == 39) { 
            move_player_right();
        }
    });

    original_second = Math.floor((new Date().getTime() / 1000.0));
    prev_second = original_second;

    status = 'playing';
    startGame();
});


function create_board_divs() {
    gameboard = $("<div id='gameboard'></div>");
    gameboard.width(columns * cell_size);
    gameboard.height(visibleRows * cell_size);

    $(document.body).append(gameboard);
}


function create_board() {
    for (var i = 0; i < rows; i++) {
        board[i] = [];
        for (var j = 0; j < columns; j++) {
            board[i][j] = 0;
        }
    }

    for (var i = 0; i < rows; i++) {
        var num_ones = Math.floor((Math.random() * max_obstacles_per_row));

        for (var j = 0; j <= num_ones; j++) {
            var position = Math.floor((Math.random() * columns));
            var state = board[i][position];
            while (state == 1) {
                position = Math.floor((Math.random() * columns));
                state = board[i][position];
                break;
            }

            board[i][position] = 1;
        }
    }
}


function create_grids() {
    for (var i = 0; i < visibleRows; i++) {
        var row = board[i];

        for (var j = 0; j < columns; j++) {
            var cell_name = 'gamecell_r' + i + '_c' + j;
            var cell = $("<div id='" + cell_name + "'></div>");
            cell.width(cell_size);
            cell.height(cell_size);
            cell.css("position", "absolute");
            cell.css("top", i * cell_size); 
            cell.css("left", j * cell_size); 

            gameboard.append(cell);
        }
    }
}


function create_counter() {
    counter = $("<div class='counter'>$ <span id='reward'>0.00<span></div>");
    $('body').append(counter);
    counter = $('#reward');
}


function create_player() {
    player = $("<div class='player'></div>");
    player.css("width", cell_size + "px");
    player.css("height", cell_size + "px");
    player.css("top", (visibleRows - 1) * cell_size);
    player.css("left", 0);
    $(gameboard).append(player);

    collective = $("<div class='collective'></div>");
    collective.css("width", cell_size + "px");
    collective.css("height", cell_size + "px");
    collective.css("top", (visibleRows - 1) * cell_size);
    collective.css("left", 0);
    $(gameboard).append(collective);
}

function update_grid(time) {

    var milliseconds = Math.floor(time % rows);
    var offset = Math.abs(milliseconds - 6);
    top_row = offset;

    for (var i = 0; i < rows; i++) {

        for (var j = 0; j < columns; j++) {
            var cell_name = 'gamecell_r' + i + '_c' + j;
            var cell = $('#' + cell_name);

            var state = board[Math.abs(((i + offset) % rows))][j];
            cell.css("background-image", 'url(bgimage.png)');
            if (state == 1) {
                cell.css("background-image", 'url(invader.png)');
            }
        }
    }

    check_if_won_or_lost();
}


function move_player_left() {
    var position = parseInt(player.css("left"));
    var move;

    if (position == 0) {
        move = cell_size * (columns - 1);
    } else {
        move = position - cell_size;
    }

    player.css("left", move + "px");
}


function move_player_right() {
    var position = parseInt(player.css("left"));
    var move;

    if (position == cell_size * (columns - 1)) {
        move = 0;
    } else {
        move = position + cell_size;
    }

    player.css("left", move + "px");
}


function check_if_won_or_lost() {
    var current_second = Math.floor(new Date().getTime() / 1000.0);
    var time = current_second - original_second;

    if (collectiveReward > 2 || status == 'won') {
        status = 'won';
        board = 0;
        clearInterval(update_interval);
        alert("You or your collaborators won! The HIT will be submitted.");
        $('#elapsedTime').attr("value", time);
        $('#reward_money').attr("value", collectiveReward);
        $(form_selector).submit();
        lose_or_win_condition();

    }
    else {
        var position = parseInt(collective.css("left"));
        position = position / cell_size;

        var state = board[(top_row + (visibleRows)) % rows][position];
        if (state == 1 || status == 'lost') {
            status = 'lost';
            board = 0;
            clearInterval(update_interval);
            alert("You lost or the crowd lost! The HIT will be submitted.");
            $('#elapsedTime').attr("value", time);
            $('#reward_money').attr("value", collectiveReward);
            $(form_selector).submit();
            lose_or_win_condition();
        }
    }
}


function startGame() {
    var data = { ship_position: 0, status: 'setup', board: 0, game_key: 0, reward: 0, mode: game_mode };
    $.ajax({
        url: "https://codingthecrowd.com/counter.php",

        dataType: "jsonp",
        data: {
            key: group_key,
            data: JSON.stringify(data)
        },

        success: function(response) {
            game_id = setup_or_create_board(response);
            console.log("Game ID is " + game_id);
            update_interval = setInterval(updateBoard, 1000);
        },
        error: function(response) {
            console.log(response);
        }
    });
}

function setup_or_create_board(response) {
    var id = 0; 
    var exists = false;
    var count = response.count;
    var array = response.results;

    for (var i = 0; i < count; i++) {
        var player_state = array[i];
        var json = JSON.parse(player_state.data);
        var player_board = json.board;
        var player_mode = json.mode ;

        if (player_board != 0) {
            console.log("Board already exists");
            exists = true;
            board = player_board;
            create_board_divs();
            id = json.game_key;
            game_mode = player_mode ; 
        }
    }

  
    if (exists == false) {
        create_board_divs();
        create_board();
        id = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

        var mode = getParameterByName('mediator');
        if(mode != null) {
            game_mode = mode ;
        }
    }

    create_grids();
    create_counter();
    create_player();

    return id;
}


function lose_or_win_condition() {
    var position = parseInt(player.css("left")) / cell_size;
    var data = { ship_position: position, status: status, board: board, game_key: game_id, reward: reward, mode: game_mode };

    $.ajax({
        url: "https://codingthecrowd.com/counter.php",

        dataType: "jsonp",
        data: {
            key: group_key,
            data: JSON.stringify(data)
        },

        success: function(response) {
            console.log("Sending lose or winning condition");
        },
        error: function(response) {
            console.log(response);
        }
    });
}


function updateBoard() {
    var position = parseInt(player.css("left")) / cell_size;
    var data = { ship_position: position, status: status, board: board, game_key: game_id, reward: reward, mode: game_mode };

    $.ajax({
        url: "https://codingthecrowd.com/counter.php",

        dataType: "jsonp",
        data: {
            key: group_key,
            data: JSON.stringify(data)
        },

        success: function(response) {
            process_group_play(response);
        },
        error: function(response) {
            console.log(response);
        }
    });
}


function process_group_play(response) {
    var plays = [];

    var count = response.count;
    var array = response.results;

    var positions = [];
    collectiveReward = 0;
    reward = reward + 0.001;

    for (var i = 0; i < count; i++) {
        var player_state = array[i];
        var json = JSON.parse(player_state.data);
        var current_game_key = json.game_key;
        var player_reward = json.reward;

        if (current_game_key == game_id) {
            var player_ship_position = json.ship_position;
            var player_status = json.status;

            collectiveReward = collectiveReward + player_reward;

            if (player_status == 'playing') {
                positions.push(player_ship_position);
            }

            if (player_status == 'lost') {
                console.log("Detected other player lost");
                status = 'lost';
            }

            if (player_status == 'won') {
                console.log("Detected other player won");
                status = 'won';
            }
        }
    }

    counter.text(collectiveReward.toFixed(3));
    if(game_mode == 'median') {
        console.log("Playing in median mode") ;
        update_collective(Math.floor(median(positions)));
    }
    if(game_mode == 'better') {
        console.log("Playing in better/average mode") ;
        update_collective(Math.floor(better(positions)));
    }
    update_grid(response.time);
}

function update_collective(position) {
    var move = position * cell_size;
    collective.css("left", move + "px");
}


function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}


function median(values) {
    values.sort(function(a, b) {
        return a - b; });
    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];
    else
        return (values[half - 1] + values[half]) / 2.0;
}


function better(values) {
    var total = 0 ;
    for(var i = 0; i < values.length; i++) {
        total += values[i];
    }

    var average = Math.round(total / values.length) ;
    return average ;
}


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//code cited from https://github.com/irealva
//worked with Isha Mehra
