module.exports = function toBatches (from, to, skipTest, cb) {
  if (to < from) throw new Error('"from" must be less than "to"')
  var batches = []
  var batch = []
  var nulls = nullArray(to - from + 1)
  var togo = nulls.length
  nulls.forEach(function (nil, i) {
    var height = from + i
    skipTest(height, function (skip) {
      if (skip) {
        if (batch.length) {
          batches.push(batch)
          batch = []
        }
      } else {
        if (batch.length) {
          batch[1]++
        } else {
          batch[0] = height
          batch[1] = height
        }
      }

      if (--togo === 0) {
        if (batch.length) {
          batches.push(batch)
        }

        cb(batches)
      }
    })
  })
}

function nullArray (n) {
  var arr = []
  for (var i = 0; i < n; i++) {
    arr.push(null)
  }

  return arr
}
