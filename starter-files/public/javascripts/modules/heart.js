import axios from 'axios'
import { $ } from './bling'

function ajaxHeart (e) {
  e.preventDefault()
  axios
    .post(this.action)
    .then(res => {
      // The form element has name="heart" so we can access it as a method
      const isHearted = this.heart.classList.toggle('heart__button--hearted')
      $('.heart-count').textContent = res.data.hearts.length
      if (isHearted) {
        this.heart.classList.add('heart__button--float')
        setTimeout(() => this.heart.classList.remove('heart__button--float'),
          2500)
      }
    })
    .catch(console.error)
}

export default ajaxHeart
