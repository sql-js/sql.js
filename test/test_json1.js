exports.test = function(sql, assert) {
  var db = new sql.Database();
  // tests taken from https://www.sqlite.org/json1.html#jmini
  [
    // The json() function
    `json(' { "this" : "is", "a": [ "test" ] } ') = '{"this":"is","a":["test"]}'`,

    // The json_array_length() function
    `json_array(1,2,'3',4) = '[1,2,"3",4]'`,
    `json_array('[1,2]') = '["[1,2]"]'`,
    `json_array(json_array(1,2)) = '[[1,2]]'`,
    `json_array(1,null,'3','[4,5]','{"six":7.7}') = '[1,null,"3","[4,5]","{\\"six\\":7.7}"]'`,
    `json_array(1,null,'3',json('[4,5]'),json('{"six":7.7}')) = '[1,null,"3",[4,5],{"six":7.7}]'`,
    `json_array_length('[1,2,3,4]') = 4`,
    `json_array_length('[1,2,3,4]', '$') = 4`,
    `json_array_length('[1,2,3,4]', '$[2]') = 0`,
    `json_array_length('{"one":[1,2,3]}') = 0`,
    `json_array_length('{"one":[1,2,3]}', '$.one') = 3`,
    `json_array_length('{"one":[1,2,3]}', '$.two') = null`,

    // The json_extract() function
    `json_extract('{"a":2,"c":[4,5,{"f":7}]}', '$') = '{"a":2,"c":[4,5,{"f":7}]}'`,
    `json_extract('{"a":2,"c":[4,5,{"f":7}]}', '$.c') = '[4,5,{"f":7}]'`,
    `json_extract('{"a":2,"c":[4,5,{"f":7}]}', '$.c[2]') = '{"f":7}'`,
    `json_extract('{"a":2,"c":[4,5,{"f":7}]}', '$.c[2].f') = 7`,
    `json_extract('{"a":2,"c":[4,5],"f":7}','$.c','$.a') = '[[4,5],2]'`,
    `json_extract('{"a":2,"c":[4,5],"f":7}','$.c[#-1]') = 5`,
    `json_extract('{"a":2,"c":[4,5,{"f":7}]}', '$.x') = null`,
    `json_extract('{"a":2,"c":[4,5,{"f":7}]}', '$.x', '$.a') = '[null,2]'`,

    // The json_insert(), json_replace, and json_set() functions
    `json_insert('[1,2,3,4]','$[#]',99) = '[1,2,3,4,99]'`,
    `json_insert('[1,[2,3],4]','$[1][#]',99) = '[1,[2,3,99],4]'`,
    `json_insert('{"a":2,"c":4}', '$.a', 99) = '{"a":2,"c":4}'`,
    `json_insert('{"a":2,"c":4}', '$.e', 99) = '{"a":2,"c":4,"e":99}'`,
    `json_replace('{"a":2,"c":4}', '$.a', 99) = '{"a":99,"c":4}'`,
    `json_replace('{"a":2,"c":4}', '$.e', 99) = '{"a":2,"c":4}'`,
    `json_set('{"a":2,"c":4}', '$.a', 99) = '{"a":99,"c":4}'`,
    `json_set('{"a":2,"c":4}', '$.e', 99) = '{"a":2,"c":4,"e":99}'`,
    `json_set('{"a":2,"c":4}', '$.c', '[97,96]') = '{"a":2,"c":"[97,96]"}'`,
    `json_set('{"a":2,"c":4}', '$.c', json('[97,96]')) = '{"a":2,"c":[97,96]}'`,
    `json_set('{"a":2,"c":4}', '$.c', json_array(97,96)) = '{"a":2,"c":[97,96]}'`,

    // The json_object() function
    `json_object('a',2,'c',4) = '{"a":2,"c":4}'`,
    `json_object('a',2,'c','{e:5}') = '{"a":2,"c":"{e:5}"}'`,
    `json_object('a',2,'c',json_object('e',5)) = '{"a":2,"c":{"e":5}}'`,

    // The json_patch() function
    `json_patch('{"a":1,"b":2}','{"c":3,"d":4}') = '{"a":1,"b":2,"c":3,"d":4}'`,
    `json_patch('{"a":[1,2],"b":2}','{"a":9}') = '{"a":9,"b":2}'`,
    `json_patch('{"a":[1,2],"b":2}','{"a":null}') = '{"b":2}'`,
    `json_patch('{"a":1,"b":2}','{"a":9,"b":null,"c":8}') = '{"a":9,"c":8}'`,
    `json_patch('{"a":{"x":1,"y":2},"b":3}','{"a":{"y":9},"c":8}') = '{"a":{"x":1,"y":9},"b":3,"c":8}'`,

    // The json_remove() function
    `json_remove('[0,1,2,3,4]','$[2]') = '[0,1,3,4]'`,
    `json_remove('[0,1,2,3,4]','$[2]','$[0]') = '[1,3,4]'`,
    `json_remove('[0,1,2,3,4]','$[0]','$[2]') = '[1,2,4]'`,
    `json_remove('[0,1,2,3,4]','$[#-1]','$[0]') = '[1,2,3]'`,
    `json_remove('{"x":25,"y":42}') = '{"x":25,"y":42}'`,
    `json_remove('{"x":25,"y":42}','$.z') = '{"x":25,"y":42}'`,
    `json_remove('{"x":25,"y":42}','$.y') = '{"x":25}'`,
    `json_remove('{"x":25,"y":42}','$') = null`,

    // The json_type() function
    `json_type('{"a":[2,3.5,true,false,null,"x"]}') = 'object'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$') = 'object'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a') = 'array'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[0]') = 'integer'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[1]') = 'real'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[2]') = 'true'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[3]') = 'false'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[4]') = 'null'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[5]') = 'text'`,
    `json_type('{"a":[2,3.5,true,false,null,"x"]}','$.a[6]') = null`,

    // The json_valid() function
    `json_valid('{"x":35}') = 1`,
    `json_valid('{"x":35') = 0`,

    // The json_quote() function
    `json_quote(3.14159) = 3.14159`,
    `json_quote('verdant') = "verdant"`
  ].forEach(function (sql) {
    assert.equal(
        String(db.exec(
            "SELECT " + sql.split(" = ")[0] + " AS val;"
        )[0].values[0][0]),
        String(sql.split(" = ")[1].replace(/'/g, "")),
        sql
    );
  });
};

if (module == require.main) {
  const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test extension functions': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}
