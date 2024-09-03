  admin routes __________________
  login  http://localhost:8080/api/v1/admin/login

  
  
  therapist routes _______________
  resister http://localhost:8080/api/v1/therepist/auth/register  REQUEST-POST
  login http://localhost:8080/api/v1/therepist/auth/register REQUEST-POST

  create a new  course- http://localhost:8080/api/v1/therepist/course/create   REQUEST-POST
  upadate course by id-  http://localhost:8080/api/v1/therepist/course/update/:_id   REQUEST-PUT
  delete by id- http://localhost:8080/api/v1/therepist/course/delete/:_id   REQUEST-DELETE
  fetch course list by therapist-http://localhost:8080/api/v1/therepist/course/course_list   REQUEST-GET
