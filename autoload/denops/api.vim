function! denops#api#echo(text) abort
  for line in split(a:msg, '\n')
    echo line
  endfor
endfunction

function! denops#api#echomsg(text) abort
  for line in split(a:msg, '\n')
    echomsg line
  endfor
endfunction

let s:variable_getters = {
      \ 'g': { prop -> get(g:, prop, v:null) },
      \ 'b': { prop -> get(b:, prop, v:null) },
      \ 'w': { prop -> get(w:, prop, v:null) },
      \ 't': { prop -> get(t:, prop, v:null) },
      \ 'v': { prop -> get(v:, prop, v:null) },
      \}
function! denops#api#getvar(group, prop) abort
  return s:variable_getters[a:group](a:prop)
endfunction

let s:variable_setters = {
      \ 'b': { prop, value -> setbufvar(0, prop, value) },
      \ 'w': { prop, value -> setwinvar(0, prop, value) },
      \ 't': { prop, value -> settabvar(0, prop, value) },
      \}
function! denops#api#setvar(group, prop, value) abort
  if a:group ==# 'g'
    let g:{a:prop} = a:value
  elseif a:group ==# 'v'
    let v:{a:prop} = a:value
  else
    call s:variable_getters[a:group](a:prop, a:value)
  endif
endfunction
