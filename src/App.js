import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Link, useNavigate, useLocation, useParams} from "react-router-dom";
import './App.css';
import React, { useState, useEffect, useRef } from "react";
import API from './api';
import axios from 'axios';

function App() {
  const [urls, setUrls] = useState([]);

  function handleStateChange(value,number){
    // 差分検出させるため新たな配列を作成
    if(number==1){
      // valueはfileオブジェクトの配列
      setUrls(urls => {return urls.concat(value);})
    }else if(number==2){
      // valueは消したいfileオブジェクトのindex番号
      setUrls(urls =>{
        return urls.filter((e,i)=>{
          if(i!=value){
            return e;
          }
        })   
      })
    }
  }  
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home/>} />
          <Route path="/" element={<Page1 value={urls} StateChange={handleStateChange}/>} />
          <Route path="/preview" element={<Page2 value={urls} StateChange={handleStateChange}/>} />
          <Route path="/completion" element={<Page3/>} />
          {/* パスワードあり id */}
          <Route path="/get-images/:id" element={<Page4/>} />
          <Route path={`*`} element={<NotFound />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;

const NotFound = () => {
  return (
    <>
      <h1>お探しのページは見つかりませんでした。</h1>
      <div>
        <Link to={`/`}>ホームに戻る</Link>
      </div>
    </>
  );
};



function Page1(props){

  return(
    <>
    <div className='title'>
    <Link to="/home">無劣化転送</Link>
    </div>
      <div className="Page" id="drag-and-drop-area">
        <DragDrop value={props.value} StateChange={props.StateChange}>
          <SelectImageButton/>
          <p>またはここに画像をドロップしてください</p>
        </DragDrop>
      </div>
    </>
  )
}

function DragDrop(props){
  let navigate = useNavigate();
  // イベントリスナーに最新の状態を取得させる　イベントリスナ自体は再描写されない
  const valueRef = useRef(null);
  valueRef.current = props.value;

  let drop_function = function(event){
    const dragAndDropArea = document.getElementById('drag-and-drop-area');
    event.preventDefault();
      dragAndDropArea.classList.remove('active');
      // モーダルウィンドウだった場合モーダルを閉じる
      const modal_arr = document.querySelectorAll('.modal-window');
      for(let i=0;i<modal_arr.length;i++){
        modal_arr[i].style.display="none";
      }
      const picture_arr = document.querySelectorAll('.list_img');
      for(let i=0;i<picture_arr.length;i++){
        picture_arr[i].style.display="inline";
      }

      // データトランスファーインスタンス作成　データ取得
      const dt = event.dataTransfer
      const files = dt.files;

      // fileオブジェクトのリストとdtとvalueRefを渡せばあとはやってくれる
      filter_and_store(files,dt);
  }

  function filter_and_store(files,dt){
    if (files.length === 0) {
      return;
    }
      // ファイルのリスト作成して　追加
      let length = files.length;
      let file_list = [];
      let file_size = 0;
      for(let i=0;i<valueRef.current.length;i++){
        file_size+=valueRef.current[i].size;
      }
      // 過去のファイルサイズをだした


      for(let i=0;i<length;i++){
        // 画像ファイルのみ OK
        if(!files[i].type.match(/image\/*/)){
          return;
        }
        file_size+=files[i].size;
        // ファイルサイズの合計が1ギガより大きいならダメ　コンテキストから取る
        if(file_size>1000000000){
          // console.log("ファイルサイズが1GBを超えました");
          return;
        }
        file_list.push(files[i]);
      }
      // 同じ写真は受け付けない 自動で弾く　同時に選択されたものなら名前異なるからok　　全て比較してる
        let state_length = valueRef.current.length
        for(let i=0;i<length;i++){
          for(let n=0;n<state_length;n++){
            if(file_list[i].name==valueRef.current[n].name){
              file_list[i]="delete";
              // 検証の早い段階でsameになると上でname指定された時undefinedになるが、　　結果に影響しない
            }
          }
        }
        // 削除
        file_list = file_list.filter(function(a){
          return a!="delete"
        });
        // 更新　追加　　完了
        props.StateChange(file_list,1);
        // データトランスファーの中身を削除
        if(dt!=undefined){
          dt.clearData();
        }else{
          // 連続して入れたのを消してまた入れられるようにする
          let input = document.querySelector('#input-file');
          input.value="";
        }
        return navigate("/preview");
  }

 // 一度しか更新しない　useEffect
  useEffect(() => {
    // イベントリスナーを登録
    const dragAndDropArea = document.getElementById('drag-and-drop-area');

    dragAndDropArea.addEventListener('dragover', (event) => {
    dragAndDropArea.classList.add('active');
    event.preventDefault();
    });

    dragAndDropArea.addEventListener('dragleave', (event) => {
      dragAndDropArea.classList.remove('active');
    });

    dragAndDropArea.addEventListener('drop', drop_function);

    const inputArea = document.querySelector(".select-image-button");
    inputArea.addEventListener("change",(event)=>{
      filter_and_store(event.target.files);
    });
  }, []);
      
  return(
    <>
        {props.children}
    </>
  )
}


function SelectImageButton(){
  return(
    <>
      <label className='select-image-button'>
        画像を選択
      <input type="file" accept="image/*" multiple id='input-file'/>
      </label>
    </>
  )
}

// ページ2
function Page2(props){
  const [sendStatus,setSendStatus] = useState();
  function handleSendStatus(str){
    setSendStatus(str);
  }

  return(
    <>
      <div className='title'>
        <Link to="/home">無劣化転送</Link>
      </div>
      <div className="Page" id="drag-and-drop-area">
        <DragDrop value={props.value}  StateChange={props.StateChange}>
          <PicturePreview value={props.value} StateChange={props.StateChange}/>
          <SelectImageButton/>
          <UploadButton value={props.value} SendStatusChange={handleSendStatus}/>
          <p>画像をダブルタップで大きく表示</p>
        </DragDrop>
      </div>
      <div className='indicator-page'>
        <div className='indicator'>
          <div className="spinner slabs" id="slabs">
            <div className="slab"></div>
            <div className="slab"></div>
            <div className="slab"></div>
            <div className="slab"></div>
          </div>
        </div>
        <div className='send-status'>転送中{sendStatus}</div>
      </div>
    </>
  )
}


function UploadButton(props){
  let navigate = useNavigate();
  // 変数のパスワード　すぐ反映される
  let v_password;
  let file_size = 0;
  // 送信前のファイルサイズ　取得
  for(let i=0;i<props.value.length;i++){
    file_size+=props.value[i].size;
  }

  async function upload_s3(formData,i,url,length){
    formData.set('file',props.value[i]);
    axios.post(url,formData,
      { headers: {  'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials':true,
                    "accept": "multipart/form-data"

      } })
    .then(res => {
      if(res.status==201){
        // 送信成功
        props.SendStatusChange((i+1)+"/"+length);
        if(i+1<length){
          // 残りがあるならまた実行
          get_data(i+1,length);
        }else{
          // 転送終了
          props.SendStatusChange((i+1)+"/"+length);
          // 次の画面に移る
          return navigate("/completion",{ state :v_password});
        }
      }
    })
  }
  
  async function get_data(i,length){
    let response_data_obj;
    if(i==0){
      const data = {file_size:file_size,file_name:props.value[0].name};
      const response = await API.post(`/image`, data );
      response_data_obj = JSON.parse(response.data);
      v_password=response_data_obj.password;
    }else{
      const data = {file_name:props.value[i].name,password:v_password};
      const response = await API.post(`/add-file-name`, data);
      response_data_obj = JSON.parse(response.data);
    }
    let formData = new FormData();
      for(const key in response_data_obj.fields.fields){
        formData.append(key,response_data_obj.fields.fields[key]);
      }
      return upload_s3(formData,i,response_data_obj.fields.url,length);
  }

  let handleSubmit = async event => {
    event.preventDefault();
    // drag-and-drop-areaをdisplay:noneにして　インジゲーターと現在の処理段階を表示
    props.SendStatusChange("0/"+props.value.length);
    const page = document.querySelector('.Page');
    const indicator= document.querySelector('.indicator-page');
    page.style.display="none";
    indicator.style.display='block';
    
    get_data(0,props.value.length);
  };
    
  return(
    <>
      <form onSubmit={handleSubmit}>
      <button disabled={props.value[0]==undefined} className='submit_button' type='submit'>アップロード</button>
      </form>
    </>
  )
}

function PicturePreview(props){
  return(
    <div className='picture-wrapper'>
      {props.value.map((file, index)=>
        <div key={file.name} className="picture-wrapper-child">
          <Picture picture_file={file} id={index} StateChange={props.StateChange}/>
        </div>
      )}
    </div>
  )
}

// urlを受け取って　表示
function Picture(props){
  const [data_url, setDataUrl] = useState([])

  const picture_arr = document.querySelectorAll('.list_img');
  const page_info = document.querySelectorAll('.page-info');
  // 現在地のモーダル
  const pre_modal = document.querySelector('#modal'+props.id);

  function open_modal(){
    pre_modal.style.display="block";
    for(let i=0;i<picture_arr.length;i++){
      picture_arr[i].style.display="none";
      page_info[i].innerHTML=String((i+1)+"/"+picture_arr.length);
    }
  }

  function close_modal(){
    pre_modal.style.display="none";
    for(let i=0;i<picture_arr.length;i++){
      picture_arr[i].style.display="inline";
    }
  }

  function next_modal(){
    const now_id = props.id+1
    const modal = document.querySelector('#modal'+now_id);
    if(modal!=null){
      pre_modal.style.display="none";
      modal.style.display="block";
    }
  }

  function previous_modal(){
    const now_id = props.id-1
    const modal = document.querySelector('#modal'+now_id);
    if(modal!=null){
      pre_modal.style.display="none";
      modal.style.display="block";
    }
  }
  read_file_and_store_dataUrl(props.picture_file,setDataUrl);

  function delete_picture(){
    props.StateChange(props.id, 2);
  }

  // スマホ用のダブルクリック作成　要素を参照しているからその要素が変わるたびに更新
  let tapCount = 0 ;
  useEffect(()=>{
    let target = document.querySelector("#pic"+props.id)
    if(target){
      target.addEventListener( "touchstart", function(e) {
        // シングルタップ判定
        if( !tapCount ) {
          ++tapCount ;
          setTimeout( function() {
            tapCount = 0 ;
          }, 350 ) ;
        // ダブルタップ判定
        } else {
          e.preventDefault() ;
          open_modal();
          tapCount = 0 ;
        }
      } ) ;
    }
  },[pre_modal])
  
  
    return( 
    <>
      <img src={data_url} loading="lazy" className='list_img' id={"pic"+props.id} onDoubleClick={open_modal}/>
      <button className='delete-button' onClick={delete_picture}>✖️</button>
      <div className='modal-window' id={"modal"+props.id}>
        <img src={data_url} loading="lazy"/>
        <button className='close_button' onClick={close_modal}>×</button>
        <button className='previous_button' onClick={previous_modal}>&lt;</button>
        <button className='next_button' onClick={next_modal}>&gt;</button>
        <div className='page-info'></div>
      </div>
    </>
    )
}

function read_file_and_store_dataUrl(file,setFunction){
  let reader = new FileReader();
  reader.onload = (e)=> {
    return setFunction(reader.result);
  }
  reader.readAsDataURL(file);
}

function Page3(){
  // 遷移元からurlを受け取る　　valueに入れる
  const location = useLocation();
// 自分のurlが必要
  let value = "https://harukifreedomein.tk/get-images/"+location.state;

  // httpsかlocalhostじゃないといかないようだ。
  function copy_url(){
    const url = document.querySelector('.link_url');
    navigator.clipboard.writeText(url.value);
  }

  return(
    <>
      <div className='title'>
        <Link to="/home">無劣化転送</Link>
      </div>
      <div className='Page'>
        <div className='completion_upload'>アップロード完了</div>
        <input className='link_url' type="button" onClick={copy_url} value={value}/>
        <ul>
          <li>上のURLを押すとコピーできます。</li>
          <li>このURLは24時間のみ有効です。</li>
          <li>URLを通して無劣化画像を共有しましょう。</li>
        </ul>
      </div>
    </>
  )
}

function Page4(){
  // urlからパスパラメータ取得
  let { id } = useParams();
  const [img , setImg] = useState([]);

  const path = "/get-image/"+id;

  // apiを送る　　/get-image/{password}
  useEffect(()=>{
    API.get(path)
    .then(res => {
      const data_obj = JSON.parse(res.data);
      const split_data = data_obj.url.split(":::");
      const urls = split_data.filter(data=>data!="");
      setImg(urls);
    })
  },[])

  function download_images(){
    for(let i=0;i<img.length;i++){
      download_image(img[i])
    }
  }
  function download_image(url){
    // ファイルネームに/が変われる可能性があるから文字数で調整する
    let fileName = url.substr(28);
    // let path = url.split("/");
    // let fileName = path[path.length-1];
    console.log("ファイル名"+fileName);
    let link = document.createElement('a');
    link.href= url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
 
  return(
    <>
      <div className='title'>
        <Link to="/home">無劣化転送</Link>
      </div>
      <div className='Page'>
        <button className='store-all-images' onClick={download_images}>全ての画像を保存する</button>
        <PictureLibrary urls={img}/>
        <p>画像をダブルタップで大きく表示</p>
      </div>
    </>
  )
}

// urlを受け取る
function PictureLibrary(props){
  return(
    <div className='picture-wrapper'>
      {props.urls.map((url, index)=>
        <div key={url} className="picture-wrapper-child">
          <Image url={url} id={index}/>
         </div>
      )}
    </div>
  )
}

// urlを受け取って　表示
function Image(props){
  let picture_arr;
  let page_info;
  let pre_modal
  useEffect(()=>{
    // 非同期でファイルを取得していて変化するから　描画後に影響する部分を更新させる
    picture_arr = document.querySelectorAll('.list_img');
    page_info = document.querySelectorAll('.page-info');
    pre_modal = document.querySelector('#modal'+props.id);
  },[props])

  function open_modal(){
    pre_modal.style.display="block";
    for(let i=0;i<picture_arr.length;i++){
      picture_arr[i].style.display="none";
      page_info[i].innerHTML=String((i+1)+"/"+picture_arr.length);
    }
  }

  function close_modal(){
    pre_modal.style.display="none";
    for(let i=0;i<picture_arr.length;i++){
      picture_arr[i].style.display="inline";
    }
  }

  function next_modal(){
    const now_id = props.id+1
    const modal = document.querySelector('#modal'+now_id);
    if(modal!=null){
      pre_modal.style.display="none";
      modal.style.display="block";
    }
  }

  function previous_modal(){
    const now_id = props.id-1
    const modal = document.querySelector('#modal'+now_id);
    if(modal!=null){
      pre_modal.style.display="none";
      modal.style.display="block";
    }
  }


  let tapCount = 0 ;
  useEffect(()=>{
    let target = document.querySelector("#pic"+props.id)
    if(target){
      target.addEventListener( "touchstart", function(e) {
        // シングルタップ判定
        if( !tapCount ) {
          ++tapCount ;
          setTimeout( function() {
            tapCount = 0 ;
          }, 350 ) ;
        // ダブルタップ判定
        } else {
          e.preventDefault() ;
          open_modal();
          tapCount = 0 ;
        }
      } ) ;
    }
  },[pre_modal])
  
  return( 
  <>
    <img src={props.url} loading="lazy" className='list_img' id={"pic"+props.id} onDoubleClick={open_modal}/>
    <a href={props.url} download className='store-button'></a>
    <div className='modal-window' id={"modal"+props.id}>
      <img src={props.url} loading="lazy"/>
      <button className='close_button' onClick={close_modal}>×</button>
      <button className='previous_button' onClick={previous_modal}>&lt;</button>
      <button className='next_button' onClick={next_modal}>&gt;</button>
      <a href={props.url} download className='modal-store-button'></a>
      <div className='page-info'></div>
    </div>
  </>
  )
}


function Home(){

  return(
    <>
      <div className='title'>
        <Link to="/home">無劣化転送</Link>
      </div>
      <div className='Page'>
        <button className='home-button'><Link to="/"><div>早速送信を始める</div></Link></button>
        <p>このサイトについて</p>
        <ul>
          <li>保存された画像は24時間後には削除されます。</li>
          <li>.heicはプレビューには非対応ですが、送信と受信(保存)は可能です。</li>
          <li>1GB以下の容量の画像ファイルに対応しています。</li>
        </ul>
      </div>
    
    </>
  )
}