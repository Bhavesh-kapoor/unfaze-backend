API END POINTS 

ROLE : ADMIN
 admin routes __________________
  login  http://localhost:8080/api/v1/admin/login
    - TOPIC ( BLOGS)
      // BLOGS CATEGORY
       API END POINTS
        CATEGORY CREATION  
         - http://127.0.0.1:8080/api/v1/admin/category/create

         ALL CATEGORY
        -  http://127.0.0.1:8080/api/v1/admin/category/all


    // FOR CREATING BLOGS 
        - http://127.0.0.1:8080/api/v1/admin/blogs/create ( post)
    // Get All Blogs
        - http://127.0.0.1:8080/api/v1/admin/blogs/all    ( get)



create a new  course http://localhost:8080/api/v1/therepist/course/create
 
  therapist routes _______________
  create a new  course- http://localhost:8080/api/v1/therepist/course/create   REQUEST-POST
  upadate course by id-  http://localhost:8080/api/v1/therepist/course/update/:_id   REQUEST-PUT
  delete by id- http://localhost:8080/api/v1/therepist/course/delete/:_id   REQUEST-DELETE
  fetch course list by therapist-http://localhost:8080/api/v1/therepist/course/course_list   REQUEST-GET
  get current user: http://localhost:8080/api/v1/therepist/auth/current-user


