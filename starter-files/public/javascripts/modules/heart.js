import axios from 'axios'

function ajaxHeart (e) {
  e.preventDefault()
  console.log('Heart it!')
  axios
    .post(this.action)
    .then(res => {
      console.log(res.data)
    })
    .catch(console.error)
}

export default ajaxHeart
