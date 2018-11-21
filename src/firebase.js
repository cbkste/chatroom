import * as firebase from 'firebase/app'
import 'firebase/database'

try {
  firebase.initializeApp({
  //firebase setup
  })
} catch (e) {}

function addMessege({content,username,}) {
  firebase
    .database()
    .ref(`messeges/quickboxChat/posts`)
    .push({
      date: Date.now(),
      content,
      username
    })
}

function subscribe(callback) {
  const ref = firebase
    .database()
    .ref(`messeges/quickboxChat/posts`)
  console.log('registering with locationid of quickbox Chat')
  ref.on('value', snapshot =>
    callback(
      Object.entries(snapshot.val() || {}).map(
        ([id, data]) => ({id, ...data}),
      ),
    ),
  )
  return () => ref.off('value', callback)
}

function allChatRoooms() {
  var result = ([])

    var ref = firebase
      .database()
      .ref('rooms')
      .orderByKey();

      ref.once("value")
        .then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            result.push({'key': childSnapshot.key, 'room':childData.room})
        });
      });
      return result;
}

export {subscribe, addMessege, allChatRoooms}
