import { useEffect, useRef } from 'react';
import { appleImg, bagImg, userImg } from '../utils';
import { navLists } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from 'antd';
import GlobalStore from '@/store';
import { replace } from 'lodash';
import styled from 'styled-components';
import { authApi } from '@/services';
import { div } from 'three/examples/jsm/nodes/Nodes.js';
import Avatar from '@/layouts/MainLayout/Header/UserLang/Avatar';

const AvatarWrapper = styled.div`
  font-family: PingFangSC-Regular;
  .username-icon-active {
    display: none;
  }
  &:hover {
    .CaretUpOutlined {
      transform: rotate(180deg);
      transition: transform 0.3s;
    }
    .username-icon {
      display: none;
    }
    .username-icon-active {
      font-family: PingFangSC-Regular;
      display: block;
    }
    .username {
      font-family: PingFangSC-Regular;
      color: #525252;
    }
  }
`;
const Navbar = () => {
  const navigate = useNavigate();
  useGSAP(() => {
    gsap.to('.nav-header-change', {
      opacity: 1,
      duration: 2,
      ease: 'funWiggle',
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
  }, []);

  const handleScroll = () => {
    //定义handleScroll事件函数
    let header = document.getElementById('header') as HTMLElement;

    let wholeScrollHeight = document.documentElement.scrollHeight, // 能够滚动的总高度
      visiableHeight = document.documentElement.clientHeight, // 可视区域高度
      currentOffset = document.documentElement.scrollTop; // 滚动的距离
    if (currentOffset > 200) {
      header.classList.add('nav-header-change');
    } else {
      header.classList.remove('nav-header-change');
    }
  };

  const goRecharge = () => {
    navigate('/recharge');
  };
  const goJobListPage = () => {
    navigate('/joblist');
  };
  const goPluginPage = () => {
    navigate('/');
  };

  const handlerDownload = () => {
    window.location.href =
      'https://software-repository-1252829527.cos.ap-nanjing.myqcloud.com/kw/ys-kcsp-sc-2024.05.30.005.zip';
  };
  return (
    <header
      id="header"
      className="w-full py-5 sm:px-10 px-5 flex justify-between items-center"
    >
      <nav className="flex w-full   justify-between items-center screen-max-width">
        <img alt="Apple" width={14} height={18} />

        {/* <div className="flex flex-1 justify-center max-sm:hidden">
          {navLists.map((nav) => (
            <div
              key={nav}
              className="px-5 text-sm cursor-pointer text-gray hover:text-white transition-all"
            >
              {nav}
            </div>
          ))}
        </div> */}

        <div className="flex items-center text-white max-sm:justify-end max-sm:flex-1">
          <div
            className="shadow-lg text-black mr-2 bg-white px-5 py-1 rounded-2xl   transition-all font-sans text-sm cursor-pointer"
            onClick={handlerDownload}
          >
            下载插件
          </div>

          <Avatar />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
