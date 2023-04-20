import { handleFaasForm } from '../rules/handleFaasForm.js';
import { getNSiblingsElements } from '../rules/utils.js';
import { getXPathByElement } from '../utils.js';

export async function parseEventSpeakerAndProduct(el, document, section) {
    return parseEventSpeaker(el, document, section, true)
}

export async function parseEventSpeakerAndFaas(el, document, section) {
  return parseEventSpeaker(el, document, section, false)
}

export async function parseWebinarTime(el, document, section, backgroundColor = '#2FBBEC') {

  let text = el.querySelector(".cmp-text")
  if (!text) {
      return ''
  }
  const container = document.createElement('div')

  container.append(document.createElement('hr'))
  container.append(WebImporter.DOMUtils.createTable([
      ['text (light, m-spacing-top, m-spacing-bottom)'],
      [text]
  ], document))
  container.append(WebImporter.DOMUtils.createTable([
      ['section-metadata'],
      ['background', backgroundColor]
  ], document))
  container.append(document.createElement('hr'))

  return container
}


function parseEventSpeaker(el, document, section, handleProduct) {
  el.querySelectorAll('.horizontalRule').forEach(item => item.remove())

  // 2 divs: speaker + product
  let els = getNSiblingsElements(el, (n) => n === 2)
  if (!els || els.length == 0) {
    return ''
  }

  // handle speaker
  const container = handleSpeaker(els[0], document)
  
  // handle form
  let titleElement = document.querySelector('.faasform')?.closest('.aem-Grid')?.querySelector('.cmp-text');
  titleElement = titleElement || document.querySelector('.faasform')?.closest('.aem-Grid')?.querySelector('.cmp-title')
  const formLink = handleFaasForm(document, document, titleElement);
  if (formLink) {
      const form = document.createElement('p');
      form.append(formLink);
      
      container.append(form)
      container.append(
          WebImporter.DOMUtils.createTable([
              ['Section Metadata'],
              ['style', 'Two-up'],
          ], document)
      )
      container.append(document.createElement('hr'))
  }
  
  // handle products
  if (handleProduct) {
    container.append(parseRelatedProducts(els[1], document))
  }

  return container
}

const handleSpeaker = (el, document) => {
    const els = getNSiblingsElements(el, (n) => n >= 2)
    if (!els || els.length == 0) {
      return ''
    }
    // title + event description
    const texts = document.createElement('div')
    els.filter(item => !item.classList.contains('dexter-Spacer') && !item.querySelector('img'))
      .map(item => {
        return item.querySelector('.cmp-text') || item.querySelector('.cmp-title')
      })
      .filter(item => item)
      .forEach(item => {
        texts.append(item)
        texts.append(document.createElement('br'))
      })
    
      // speakers
    const speakers = els
      .filter(item => !item.classList.contains('dexter-Spacer'))
      .map(item => {
        let images = item.querySelectorAll('img')
        if(!images) {
          return null
        }
        const tmpSpeakers = []
        images.forEach((image) => {
          if (!image.src) {
            return
          }
          const speaker = [];
          console.log(image.classList)
          console.log(getXPathByElement(image))
          speaker.push(image);
          let nextEl = image.closest('.image')
          while(nextEl) {
            const texts = nextEl.querySelectorAll('.cmp-text')
            if(texts && texts.length === 2){
              speaker.push(`<p><strong>${texts[0].innerHTML}</strong></p><p>${texts[1]?.innerHTML}</p>`);
            } else if(texts && texts.length === 1) {
              speaker.push(texts[0].innerHTML)
            }
            nextEl = nextEl.nextElementSibling
          }
          if(speaker.length <= 2){
            speaker.push('')
          }
          tmpSpeakers.push(speaker)
        })
        return tmpSpeakers
      })
      .filter(item => item)
      .flat()
  
    if (!speakers || speakers.length === 0) {
    return '';
    }
  
    const container = document.createElement('div')
    container.append(
        WebImporter.DOMUtils.createTable([
            ['Text'],
            [texts]
        ], document)
    )
    container.append(document.createElement('hr'))
    container.append(
        WebImporter.DOMUtils.createTable([
            ['Event Speakers'],
            ...speakers,
        ], document)
    )
    return container
};

const parseRelatedProducts = (el, document) => {
    const title = el.querySelector('.cmp-title')
    const text = el.querySelector('.cmp-text')
    if (!title || !text) {
        return ''
    }
    const container = document.createElement('div')
    container.append(title)
    container.append(document.createElement('br'))
    container.append(text)

    return WebImporter.DOMUtils.createTable([
        ['Text (vertical)'],
        ['#f5f5f5'],
        [container],
    ], document);
};
