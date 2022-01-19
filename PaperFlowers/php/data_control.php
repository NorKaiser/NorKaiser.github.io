<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "paperflowers";

// 创建连接
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("connect failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents('php://input'), true);
    $appId = $data['appId'];
    $shapeIndex = $data['shapeIndex'];
    $rect = json_encode($data['rect']);
    $pointList = json_encode($data['pointList']);

    $sql = "INSERT INTO paperflowers (pointList, appId,shapeId,rect, executed)
VALUES ('$pointList','$appId','$shapeIndex','$rect', false )";

    if ($conn->query($sql) === TRUE) {
        echo "data inserted";
    } else {
        echo "Error: " . $sql . "<br>" . $conn->error;
    }
} else if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $appId = $_GET["appId"];

    $sql = "SELECT shapeId,rect,pointList FROM paperflowers WHERE appId=\"$appId\" and executed=false LIMIT 1";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo  "{\"pointList\": " . $row['pointList'] . " , \"shapeIndex\": " . $row["shapeId"] . " , \"rect\": " . $row["rect"] . "}";
        }
        $sql_update = "UPDATE paperflowers SET executed = true WHERE appId=\"$appId\" and executed=false LIMIT 1";
        mysqli_query($conn,$sql_update);

    } else {
        echo "not found";
    }
}
$conn->close();
