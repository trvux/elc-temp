import * as fs from "fs";
import * as path from "path";

const OUTPUT_FILE = path.join(process.cwd(), "scratch/final-seo-data.json");

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOData {
  content: string;
  faq: FAQItem[];
}

const FINAL_SEO_DATA: Record<string, SEOData> = {
  // === GROUPS ===
  "may-lanh": {
    content: `
      <p>Điện máy ELC tự hào là tổng kho phân phối các dòng máy lạnh (điều hòa không khí) chính hãng hàng đầu tại Thành phố Hồ Chí Minh. Chúng tôi mang đến trọn gói các giải pháp làm mát từ dân dụng cho gia đình đến hệ thống điều hòa thương mại, công nghiệp cho biệt thự, văn phòng, nhà xưởng.</p>
      <h2>Các dòng máy lạnh phân phối chủ lực tại Điện máy ELC</h2>
      <ul>
        <li><strong>Máy lạnh treo tường:</strong> Thiết kế nhỏ gọn, tiết kiệm điện năng cho phòng ngủ, phòng khách diện tích nhỏ và vừa.</li>
        <li><strong>Máy lạnh âm trần Cassette:</strong> Làm lạnh đa hướng thổi 360 độ sang trọng, lý tưởng cho không gian quán cafe, nhà hàng, văn phòng lớn.</li>
        <li><strong>Máy lạnh giấu trần nối ống gió:</strong> Thẩm mỹ đỉnh cao ẩn giấu dàn lạnh phía trong trần thạch cao, luồng gió thổi qua các cửa gió nghệ thuật.</li>
        <li><strong>Máy lạnh tủ đứng đặt sàn:</strong> Luồng gió mạnh mẽ thổi xa chuyên trị cho không gian rộng lớn, đông người qua lại.</li>
      </ul>
      <h2>Cam kết dịch vụ từ Điện máy ELC</h2>
      <ul>
        <li>Hàng chính hãng mới 100% nguyên đai nguyên kiện, đầy đủ CO/CQ và bảo hành chính hãng.</li>
        <li>Giá bán tại kho cạnh tranh nhất thị trường kèm nhiều ưu đãi thi công lắp đặt vật tư.</li>
        <li>Đội ngũ kỹ thuật viên tay nghề cao, lắp đặt nhanh chóng, an toàn và đúng tiêu chuẩn của hãng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Điện máy ELC phân phối máy lạnh của những hãng nào?",
        answer: "Chúng tôi là đại lý chính thức phân phối máy lạnh Daikin, Panasonic, LG, Samsung, Mitsubishi, Gree, Midea, Carrier, và Toshiba."
      },
      {
        question: "Tôi có được miễn phí khảo sát lắp đặt không?",
        answer: "Có. Kỹ thuật viên của Điện máy ELC hỗ trợ khảo sát mặt bằng tận công trình miễn phí tại TP.HCM để đưa ra phương án thiết kế lắp đặt ống đồng và chọn công suất máy lạnh tối ưu."
      }
    ]
  },
  "nha-thong-minh": {
    content: `
      <p>Giải pháp nhà thông minh (Smart Home) tại Điện máy ELC mang đến không gian sống hiện đại, tiện nghi vượt trội. Toàn bộ thiết bị điện trong nhà từ chiếu sáng, điều hòa, rèm cửa đến camera an ninh đều có thể tự động hóa hoặc điều khiển từ xa qua điện thoại thông minh và giọng nói.</p>
      <h2>Ưu điểm của giải pháp nhà thông minh ELC</h2>
      <ul>
        <li><strong>Chiếu sáng thông minh tự động:</strong> Tự động bật/mở theo lịch trình sinh hoạt hoặc cảm biến chuyển động khi bạn đi qua.</li>
        <li><strong>Kiểm soát nhiệt độ thông minh:</strong> Tự động điều chỉnh máy lạnh dễ chịu vào ban đêm để bảo vệ sức khỏe và tiết kiệm điện.</li>
        <li><strong>An ninh đa lớp 24/7:</strong> Cảnh báo xâm nhập lập tức qua điện thoại, kết hợp cảm biến rò rỉ gas, khói phòng ngừa cháy nổ.</li>
      </ul>
    `,
    faq: [
      {
        question: "Lắp đặt nhà thông minh có phải khoan đục tường không?",
        answer: "Không. Các thiết bị thông minh hiện nay sử dụng giao thức không dây sóng Zigbee hoặc Wi-Fi, lắp đặt thay thế trực tiếp vào đế âm tường truyền thống vô cùng nhanh gọn."
      },
      {
        question: "Khi mất mạng Internet thì nhà thông minh có hoạt động được không?",
        answer: "Các kịch bản tự động hóa nội bộ (như bật đèn khi mở cửa, bấm nút công tắc tắt hết đèn) vẫn hoạt động bình thường nhờ bộ điều khiển trung tâm cục bộ."
      }
    ]
  },
  "may-loc-khong-khi": {
    content: `
      <p>Máy lọc không khí là tấm khiên bảo vệ gia đình bạn khỏi bụi mịn PM2.5, phấn hoa, mùi ẩm mốc và các vi khuẩn có hại. Điện máy ELC cung cấp các dòng máy lọc khí chuyên dụng hiệu năng cao phù hợp cho mọi diện tích phòng ngủ, phòng khách đến văn phòng làm việc.</p>
      <h2>Tính năng nổi bật của máy lọc không khí chính hãng</h2>
      <ul>
        <li><strong>Bộ lọc HEPA chất lượng cao:</strong> Giữ lại đến 99.97% hạt bụi siêu mịn có kích thước nhỏ tới 0.3 micromet.</li>
        <li><strong>Màng lọc than hoạt tính:</strong> Khử sạch mùi thức ăn, khói thuốc, mùi thú cưng và các hợp chất hữu cơ bay hơi độc hại.</li>
        <li><strong>Cảm biến chất lượng không khí thông minh:</strong> Tự động đo độ ô nhiễm trong phòng và điều chỉnh tốc độ quạt lọc tối ưu.</li>
      </ul>
    `,
    faq: [
      {
        question: "Bao lâu thì cần thay màng lọc máy lọc không khí?",
        answer: "Màng lọc thô nên vệ sinh hàng tháng. Màng lọc HEPA và than hoạt tính nên được thay thế mới sau 6-12 tháng tùy thuộc mức độ ô nhiễm không khí xung quanh."
      },
      {
        question: "Nên chọn công suất máy lọc không khí như thế nào?",
        answer: "Hãy chọn máy có lưu lượng gió lọc (CADR) tương ứng với diện tích phòng. Chọn máy dư công suất một chút sẽ giúp phòng lọc sạch nhanh hơn và êm ái hơn."
      }
    ]
  },
  "may-loc-nuoc": {
    content: `
      <p>Máy lọc nước RO chính hãng tại Điện máy ELC mang lại nguồn nước tinh khiết đạt chuẩn uống trực tiếp tại vòi cho gia đình bạn. Tích hợp công nghệ lọc đa tầng tiên tiến giúp loại bỏ các kim loại nặng, hóa chất độc hại, vi khuẩn và bổ sung khoáng chất tự nhiên có lợi cho sức khỏe.</p>
      <h2>Ưu điểm của máy lọc nước RO do ELC phân phối</h2>
      <ul>
        <li><strong>Màng lọc RO tiên tiến:</strong> Kích thước khe lọc siêu nhỏ loại bỏ hoàn toàn tạp chất, vi khuẩn và ion kim loại nặng có trong nguồn nước.</li>
        <li><strong>Lõi bù khoáng hoạt tính:</strong> Bổ sung các vi lượng khoáng chất tự nhiên thiết yếu như Canxi, Magie giúp nước có vị ngọt thanh tự nhiên.</li>
        <li><strong>Tích hợp Nóng - Lạnh tiện lợi:</strong> Một số dòng máy cao cấp trang bị vòi nước nóng lạnh tức thì, đáp ứng nhu cầu pha trà, pha sữa, giải khát nhanh chóng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Nước từ máy lọc RO có cần đun sôi lại trước khi uống không?",
        answer: "Nguồn nước sau khi đi qua hệ thống lọc RO của các hãng uy tín đã đạt chuẩn nước uống trực tiếp QCVN 6-1:2010/BYT nên bạn có thể uống trực tiếp ngay tại vòi không cần đun sôi."
      },
      {
        question: "Bao lâu cần thay lõi lọc nước định kỳ?",
        answer: "Lõi lọc thô số 1, 2, 3 nên thay sau 3-6 tháng. Màng lọc RO chính nên thay sau 18-24 tháng. Các lõi chức năng bù khoáng nên thay sau 12 tháng."
      }
    ]
  },

  // === CATEGORIES ===
  "may-lanh-ap-tran": {
    content: `
      <p>Máy lạnh áp trần (điều hòa áp trần) là dòng máy lạnh thương mại đặt sát bề mặt trần nhà. Với công suất gió mạnh mẽ và thiết kế liền trần gọn gàng, dòng máy này là giải pháp làm mát tối ưu cho văn phòng rộng, nhà hàng, cửa hàng tiện lợi và biệt thự.</p>
      <h2>Ưu điểm nổi bật của máy lạnh áp trần chính hãng</h2>
      <ul>
        <li><strong>Làm mát cực nhanh và xa:</strong> Thiết kế cửa gió rộng cùng cánh đảo gió thông minh giúp phân bổ lưu lượng gió mát lạnh đều khắp diện tích không gian lớn.</li>
        <li><strong>Tiết kiệm không gian lắp đặt:</strong> Gắn sát mép trần bê tông hoặc thạch cao giúp căn phòng thoáng rộng, không tốn diện tích sàn như máy lạnh tủ đứng.</li>
        <li><strong>Bền bỉ vượt thời gian:</strong> Khả năng hoạt động liên tục ổn định, độ bền động cơ cực cao và cực kỳ dễ dàng vệ sinh, bảo dưỡng định kỳ.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lạnh áp trần lắp đặt có cần trần thạch cao không?",
        answer: "Không cần. Bạn có thể lắp máy lạnh áp trần trực tiếp lên trần bê tông phẳng mà vẫn đảm bảo tính thẩm mỹ cao."
      },
      {
        question: "Độ cao lắp đặt máy lạnh áp trần bao nhiêu là phù hợp?",
        answer: "Nên lắp đặt ở độ cao cách mặt sàn từ 2.7m - 3.5m để luồng khí lạnh được phân bổ tốt nhất và không phả trực tiếp vào người sử dụng."
      }
    ]
  },
  "may-cap-khi-tuoi-loc-khong-khi": {
    content: `
      <p>Hệ thống cấp khí tươi và lọc không khí là giải pháp mang tính đột phá giúp cung cấp luồng gió sạch, giàu oxy từ ngoài trời vào trong nhà, đồng thời hút các chất độc hại, khí CO2 ra ngoài. Hệ thống này là lá phổi xanh bảo vệ sức khỏe cho cả gia đình bạn.</p>
      <h2>Những tính năng ưu việt của máy lọc cấp khí tươi</h2>
      <ul>
        <li><strong>Lọc bụi mịn HEPA H13:</strong> Ngăn chặn triệt để bụi mịn PM2.5, vi khuẩn, phấn hoa có kích thước siêu nhỏ xâm nhập vào phòng.</li>
        <li><strong>Hệ thống hồi nhiệt thông minh ERV:</strong> Thu hồi và trao đổi nhiệt độ giữa luồng khí đi ra và đi vào, đảm bảo phòng lạnh không bị mất nhiệt, tiết kiệm tối đa điện năng.</li>
        <li><strong>Hoạt động êm ái:</strong> Hệ thống cách âm tốt đảm bảo thiết bị hoạt động êm ái dưới 30dB, không làm ảnh hưởng đến giấc ngủ của bạn.</li>
      </ul>
    `,
    faq: [
      {
        question: "Hệ thống ERV hồi nhiệt hoạt động như thế nào?",
        answer: "Khi hút khí thải mát từ phòng ra ngoài và cấp khí tươi nóng từ ngoài vào, bộ trao đổi nhiệt sẽ truyền hơi lạnh từ khí thải sang khí tươi cấp vào, giúp khí tươi vào phòng đã được làm mát sẵn."
      },
      {
        question: "Lắp đặt hệ thống cấp khí tươi phù hợp cho những công trình nào?",
        answer: "Phù hợp cho căn hộ chung cư cao cấp đóng kín cửa, nhà phố sát mặt đường nhiều khói bụi, phòng ngủ trẻ em, văn phòng làm việc và phòng khám."
      }
    ]
  },
  "may-loc-nuoc-ro-3-in-1": {
    content: `
      <p>Máy lọc nước RO 3 in 1 là dòng sản phẩm đa năng cao cấp tích hợp đầy đủ 3 chế độ nước: Nóng - Lạnh - Tinh khiết tiện dụng trên cùng một vòi nước. Thiết bị giải quyết triệt để nhu cầu sử dụng nước sinh hoạt hàng ngày nhanh chóng và an toàn tuyệt đối cho sức khỏe.</p>
      <h2>Các tính năng nổi bật của máy lọc nước RO 3 in 1</h2>
      <ul>
        <li><strong>Công nghệ làm lạnh Block siêu nhanh:</strong> Làm lạnh nước sâu dưới 10 độ C nhanh chóng như nước trong tủ lạnh, giải khát tức thì.</li>
        <li><strong>Làm nóng tức thì:</strong> Khả năng cung cấp nước nóng lên tới 95 độ C phục vụ pha trà, cà phê, pha sữa hay nấu mì tiện lợi.</li>
        <li><strong>Hệ thống lọc RO đa tầng:</strong> Đảm bảo nguồn nước tinh khiết uống trực tiếp tại vòi đạt tiêu chuẩn vệ sinh của Bộ Y Tế.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lọc nước 3 in 1 có tốn điện không?",
        answer: "Các dòng máy hiện đại trang bị công nghệ cảm biến và bình chứa bảo ôn giữ nhiệt cực tốt, máy chỉ đun nóng/làm lạnh khi nhiệt độ thay đổi nên lượng điện năng tiêu thụ rất tiết kiệm."
      },
      {
        question: "Thiết bị có chế độ khóa vòi nóng an toàn cho trẻ em không?",
        answer: "Có. Tất cả các sản phẩm máy lọc nước nóng lạnh 3 in 1 chính hãng đều trang bị nút khóa vòi nóng thông minh để bảo vệ trẻ nhỏ khỏi bị bỏng."
      }
    ]
  },
  "may-lanh-treo-tuong": {
    content: `
      <p>Máy lạnh treo tường (điều hòa treo tường) là dòng sản phẩm làm mát phổ biến, gọn nhẹ và tiết kiệm chi phí nhất hiện nay. Máy phù hợp cho các không gian phòng khép kín dưới 40m2 như phòng ngủ gia đình, phòng học hay văn phòng nhỏ.</p>
      <h2>Những ưu điểm vượt trội của máy lạnh treo tường ELC</h2>
      <ul>
        <li><strong>Công nghệ Inverter tiết kiệm điện đến 60%:</strong> Duy trì nhiệt độ phòng ổn định mà không cần khởi động lại máy nén liên tục, giảm hóa đơn điện rõ rệt.</li>
        <li><strong>Làm lạnh nhanh Turbo/Powerful:</strong> Nhanh chóng hạ nhiệt độ phòng xuống mức cài đặt chỉ trong vòng 15-20 phút ngay sau khi khởi động.</li>
        <li><strong>Đa dạng thương hiệu:</strong> Phân phối đầy đủ các thương hiệu hàng đầu như Daikin, Panasonic, LG, Samsung, Gree, Toshiba với đầy đủ dải công suất 1HP, 1.5HP, 2HP, 2.5HP.</li>
      </ul>
    `,
    faq: [
      {
        question: "Nên chọn công suất máy lạnh treo tường thế nào cho đúng?",
        answer: "Chọn công suất dựa trên diện tích phòng: phòng dưới 15m2 dùng máy 1HP, từ 15-20m2 dùng máy 1.5HP, từ 20-30m2 dùng máy 2HP, và từ 30-40m2 dùng máy 2.5HP."
      },
      {
        question: "Lưới lọc bụi của máy treo tường có tự vệ sinh được không?",
        answer: "Được. Bạn có thể tự tháo nắp dàn lạnh định kỳ 1-2 tháng/lần, rút lưới lọc bụi ra xịt rửa sạch bằng nước thông thường rồi lau khô lắp lại để máy thổi gió mạnh hơn."
      }
    ]
  },
  "remote-cam-tay": {
    content: `
      <p>Remote cầm tay (bộ điều khiển từ xa) là thiết bị không thể thiếu giúp tương tác và điều khiển hoạt động của các hệ thống máy lạnh, smart home và các thiết bị điện tử. Điện máy ELC cung cấp các dòng remote chính hãng của các thương hiệu điều hòa lớn và remote đa năng chất lượng cao.</p>
      <h2>Các loại remote cầm tay phân phối tại ELC</h2>
      <ul>
        <li><strong>Remote chính hãng thương hiệu:</strong> Thay thế hoàn hảo cho remote cũ bị hỏng của Daikin, Panasonic, LG, Samsung, Mitsubishi.</li>
        <li><strong>Remote đa năng thông minh:</strong> Tương thích với hơn 1000 thương hiệu điều hòa khác nhau trên thị trường, dễ dàng tự thiết lập.</li>
        <li><strong>Độ nhạy và khoảng cách nhận sóng tốt:</strong> Khoảng cách nhận tín hiệu lên tới 8-10m, phím bấm êm ái và hiển thị màn hình LCD rõ ràng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Làm thế nào để cài đặt remote điều hòa đa năng?",
        answer: "Bạn chỉ cần lắp pin vào, nhấn giữ nút 'Set' trên remote cho đến khi mã code nhấp nháy, bấm phím tăng giảm nhiệt độ để chọn mã phù hợp của hãng cho đến khi điều hòa kêu tít, sau đó nhấn 'Ok' để hoàn tất."
      },
      {
        question: "Remote điều hòa nhanh hết pin là do đâu?",
        answer: "Do sử dụng pin kém chất lượng dễ chảy nước làm rỉ sét lò xo tiếp điện, hoặc do mạch điều khiển bên trong bị ẩm. Nên sử dụng pin kiềm (Alkaline) chất lượng tốt để bảo vệ remote."
      }
    ]
  },
  "may-lanh-am-tran-da-huong-thoi": {
    content: `
      <p>Máy lạnh âm trần đa hướng thổi (Cassette thổi gió 4 hướng hoặc thổi tròn 360 độ) là dòng sản phẩm điều hòa thương mại cao cấp. Dàn lạnh được giấu chìm hoàn toàn trong trần thạch cao, mang lại tính thẩm mỹ sang trọng bậc nhất cho không gian văn phòng, nhà hàng tiệc cưới, showroom và sảnh chung cư.</p>
      <h2>Lý do máy lạnh âm trần đa hướng thổi được ưa chuộng</h2>
      <ul>
        <li><strong>Thổi gió dễ chịu 360 độ:</strong> Thiết kế mặt nạ thông minh giúp thổi luồng khí lạnh lan tỏa đều từ mọi hướng, tránh hiện tượng gió lùa lạnh buốt ở một khu vực.</li>
        <li><strong>Thiết kế chìm tinh tế:</strong> Phẳng hoàn toàn sát bề mặt trần thạch cao, giúp trần nhà thông thoáng và hiện đại.</li>
        <li><strong>Tích hợp bơm nước xả dàn lạnh:</strong> Tự động bơm đẩy nước xả ngưng lên cao để đi ống thoát nước ngang dễ dàng, phòng tránh tuyệt đối sự cố rò rỉ nước tường nhà.</li>
      </ul>
    `,
    faq: [
      {
        question: "Trần thạch cao cách trần bê tông bao nhiêu thì lắp được máy âm trần?",
        answer: "Độ cao khe trần tối thiểu cần từ 285mm - 350mm tùy theo công suất máy để có đủ không gian lắp đặt dàn lạnh và đường ống gió."
      },
      {
        question: "Bảo dưỡng máy lạnh âm trần cassette có phức tạp không?",
        answer: "Việc tháo lắp mặt nạ để rửa lưới lọc bụi khá đơn giản. Tuy nhiên việc xịt rửa dàn lạnh sâu bên trong trần cần kỹ thuật viên chuyên nghiệp có thiết bị bạt che chuyên dụng để tránh làm bẩn nội thất xung quanh."
      }
    ]
  },
  "may-lanh-giau-tran-noi-ong-gio": {
    content: `
      <p>Máy lạnh giấu trần nối ống gió là giải pháp điều hòa đẳng cấp nhất về mặt kiến trúc nội thất. Toàn bộ dàn lạnh và các đường ống gió phức tạp được lắp ẩn hoàn toàn phía trên trần thạch cao. Khí lạnh mát lành sẽ được dẫn ra phòng thông qua các miệng gió nghệ thuật thiết kế tùy chỉnh theo ý muốn của chủ đầu tư.</p>
      <h2>Ưu điểm đẳng cấp của điều hòa giấu trần nối ống gió</h2>
      <ul>
        <li><strong>Thiết kế cá nhân hóa nghệ thuật:</strong> Bạn có thể tùy chọn kiểu dáng miệng gió (Linear dài, miệng gió slot, miệng gió khuếch tán) để hòa quyện hoàn hảo vào không gian thiết kế của biệt thự hoặc căn hộ cao cấp.</li>
        <li><strong>Không gian yên tĩnh tuyệt đối:</strong> Dàn lạnh được lắp khuất sau vách thạch cao cách âm tốt và giảm chấn qua ống gió mềm, mang lại sự tĩnh lặng hoàn hảo cho phòng ngủ hoặc phòng làm việc của bạn.</li>
        <li><strong>Làm mát đều toàn bộ các góc phòng:</strong> Phân phối gió đồng đều qua các điểm cửa gió bố trí linh hoạt khắp trần nhà.</li>
      </ul>
    `,
    faq: [
      {
        question: "Lắp máy lạnh nối ống gió cần lưu ý điều gì?",
        answer: "Cần phải thiết kế lỗ thăm trần thạch cao kích thước tối thiểu 600x600mm ngay dưới dàn lạnh để kỹ thuật viên có thể bảo dưỡng, vệ sinh lưới lọc và sửa chữa bo mạch dễ dàng."
      },
      {
        question: "Nên lắp đặt máy giấu trần nối ống gió ở giai đoạn nào?",
        answer: "Phải thi công song song ở giai đoạn xây thô, đi ống đồng, ống nước và treo dàn lạnh trước khi đội thạch cao tiến hành đóng khung xương và làm trần thạch cao."
      }
    ]
  },
  "may-lanh-tu-dung": {
    content: `
      <p>Máy lạnh tủ đứng (điều hòa cây) là dòng điều hòa đặt sàn thổi gió trực tiếp với công suất cực mạnh. Thiết kế dạng tủ đứng hiện đại, lịch lãm, thích hợp cho các khu vực có diện tích rộng lớn, trần cao và đông người như showroom, văn phòng, nhà xưởng, giảng đường lớn.</p>
      <h2>Những thế mạnh nổi bật của máy lạnh tủ đứng</h2>
      <ul>
        <li><strong>Tốc độ làm mát siêu tốc:</strong> Cánh quạt thổi gió công suất lớn với luồng gió thổi xa lên tới 15 - 20m, hạ nhiệt độ phòng nhanh chóng chỉ sau vài phút khởi động.</li>
        <li><strong>Lắp đặt và di dời linh hoạt:</strong> Đặt sàn trực tiếp nên việc thi công đường ống đồng đi thấp dọc chân tường cực kỳ nhanh gọn và dễ dàng vệ sinh lưới lọc mà không cần leo cao.</li>
        <li><strong>Bền bỉ hoạt động tần suất cao:</strong> Thiết kế dàn cơ tối ưu cho việc hoạt động liên tục trong môi trường đông người, không gian mở.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy tủ đứng hoạt động có ồn không?",
        answer: "Do quạt thổi gió công suất lớn đặt ngay dưới sàn phòng nên tiếng ồn luồng gió thổi sẽ lớn hơn so với máy lạnh treo tường hay âm trần. Phù hợp nhất cho khu vực đông người, văn phòng làm việc năng động."
      },
      {
        question: "Máy lạnh tủ đứng có dòng 3 pha không?",
        answer: "Có. Các máy lạnh tủ đứng công suất lớn từ 5HP (48.000 BTU) trở lên thường sử dụng nguồn điện 3 pha để đảm bảo nguồn điện cấp hoạt động ổn định và tiết kiệm điện nén."
      }
    ]
  },
  "phu-kien-dong-bo-cua-he-thong-cap-gio-tuoi": {
    content: `
      <p>Để hệ thống cấp khí tươi và thông gió hoạt động ổn định, êm ái và đạt hiệu suất cao nhất, việc sử dụng các phụ kiện đồng bộ tiêu chuẩn là vô cùng quan trọng. Điện máy ELC cung cấp đầy đủ các loại phụ kiện chính hãng phục vụ lắp đặt hệ thống gió tươi ERV/HRV chuyên nghiệp.</p>
      <h2>Các loại phụ kiện gió tươi phân phối tại ELC</h2>
      <ul>
        <li><strong>Miệng gió nghệ thuật và miệng gió chống mưa:</strong> Cửa gió khuếch tán trong nhà thẩm mỹ và miệng chụp gió ngoài trời inox tích hợp lưới ngăn côn trùng.</li>
        <li><strong>Ống gió mềm kháng khuẩn và ống gió bảo ôn:</strong> Ống dẫn gió tiêu chuẩn giảm ồn tốt, chống bám bụi và ngăn chặn rò rỉ nhiệt lạnh.</li>
        <li><strong>Bộ chia gió, van chỉnh gió (VCD) và giảm chấn:</strong> Điều tiết lưu lượng gió tươi cấp vào từng phòng dễ dàng theo thiết kế.</li>
      </ul>
    `,
    faq: [
      {
        question: "Tại sao nên dùng ống gió mềm kháng khuẩn?",
        answer: "Ống gió mềm kháng khuẩn có lớp bạc bên trong ngăn ngừa nấm mốc và vi khuẩn tích tụ theo thời gian, đảm bảo khí tươi dẫn vào phòng luôn sạch tinh khiết nhất."
      },
      {
        question: "Chụp gió ngoài trời nên dùng chất liệu gì?",
        answer: "Nên chọn chụp gió inox 304 để chống rỉ sét do mưa nắng ngoài trời, tích hợp lưới inox ngăn côn trùng và chim làm tổ bên trong ống."
      }
    ]
  },
  "bang-dieu-khien": {
    content: `
      <p>Bảng điều khiển điều hòa (điều khiển dây gắn tường) là thiết bị trung tâm quản lý hoạt động của máy lạnh thương mại VRV, Multi và điều hòa trung tâm. Điện máy ELC cung cấp các dòng bảng điều khiển dây chính hãng chất lượng cao, màn hình trực quan hiển thị thông số rõ nét.</p>
      <h2>Ưu điểm của bảng điều khiển dây gắn tường</h2>
      <ul>
        <li><strong>Điều khiển ổn định tuyệt đối:</strong> Kết nối trực tiếp bằng dây tín hiệu đến bo mạch dàn lạnh, loại bỏ hoàn toàn hiện tượng nhiễu sóng hoặc hết pin như remote cầm tay.</li>
        <li><strong>Lập lịch hoạt động thông minh:</strong> Cho phép cài đặt lịch hẹn giờ bật/tắt tự động theo tuần cho văn phòng, kiểm soát tiết kiệm điện năng tối đa.</li>
        <li><strong>Màn hình hiển thị đa chức năng:</strong> Xem chi tiết nhiệt độ, độ ẩm, mã lỗi tự chẩn đoán của hệ thống dàn lạnh để bảo trì sửa chữa kịp thời.</li>
      </ul>
    `,
    faq: [
      {
        question: "Bảng điều khiển dây Daikin BRC1E63 có gì nổi bật?",
        answer: "Đây là dòng điều khiển thông minh có màn hình LCD đèn nền sáng rõ, ngôn ngữ tiếng Anh/tiếng Việt dễ dùng, hỗ trợ lập lịch hàng tuần và hiển thị mã lỗi điều hòa chi tiết."
      },
      {
        question: "Có thể kết nối 1 bảng điều khiển dây cho nhiều dàn lạnh không?",
        answer: "Được. Tùy theo thiết lập của hệ thống (Group Control), bạn có thể dùng 1 điều khiển dây để tắt/mở đồng thời cho tối đa 16 dàn lạnh trong cùng một khu vực mở."
      }
    ]
  },
  "cong-tac-thong-minh": {
    content: `
      <p>Công tắc thông minh là thiết bị hạt nhân trong giải pháp chiếu sáng Smart Home. Thiết kế mặt kính cường lực sang trọng kết hợp phím bấm cảm ứng nhạy bén, giúp bạn kiểm soát bật/tắt toàn bộ hệ thống đèn trong nhà thông qua ứng dụng điện thoại hoặc điều khiển bằng giọng nói.</p>
      <h2>Ưu điểm vượt trội của công tắc thông minh</h2>
      <ul>
        <li><strong>Thiết kế thẩm mỹ sang trọng:</strong> Phím chạm cảm ứng có đèn LED hiển thị định vị ban đêm dịu nhẹ, mặt kính cường lực chống xước tuyệt đối.</li>
        <li><strong>Bật/tắt hẹn giờ tự động từ xa:</strong> Lập kịch bản hẹn giờ bật đèn sân vườn lúc 18h và tắt lúc 6h sáng, hoặc tắt toàn bộ thiết bị chỉ với một chạm khi ra khỏi nhà.</li>
        <li><strong>Tương thích hoàn hảo:</strong> Sử dụng chuẩn đế âm chữ nhật hoặc vuông truyền thống của Việt Nam, thay thế lắp ráp cực kỳ nhanh gọn.</li>
      </ul>
    `,
    faq: [
      {
        question: "Công tắc thông minh Zigbee khác gì dòng Wi-Fi?",
        answer: "Công tắc Zigbee kết nối qua bộ điều khiển trung tâm giúp hệ thống chạy ổn định, không chiếm băng thông của modem Wi-Fi nhà bạn và các kịch bản tự động hóa vẫn hoạt động bình thường khi mất internet."
      },
      {
        question: "Tôi có thể tự thay công tắc thông minh tại nhà không?",
        answer: "Được nếu bạn am hiểu một chút về điện. Chỉ cần ngắt cầu dao điện, tháo công tắc cũ ra và đấu dây (cần lưu ý công tắc thông minh thường yêu cầu có dây nguội N để cấp nguồn hoạt động ổn định)."
      }
    ]
  },
  "cam-bien-thong-minh": {
    content: `
      <p>Cảm biến thông minh đóng vai trò là 'giác quan' của ngôi nhà thông minh. Các loại cảm biến giúp ghi nhận sự thay đổi của môi trường như chuyển động, nhiệt độ, độ ẩm hay đóng/mở cửa để kích hoạt các kịch bản tự động hóa thông minh giúp bảo vệ an ninh và tiết kiệm điện năng sinh hoạt.</p>
      <h2>Các loại cảm biến thông minh phân phối tại ELC</h2>
      <ul>
        <li><strong>Cảm biến chuyển động:</strong> Tự động bật đèn khi bạn đi qua hành lang, nhà vệ sinh và tắt đi khi không có người.</li>
        <li><strong>Cảm biến cửa (cửa sổ/cửa chính):</strong> Phát hiện trạng thái đóng/mở để kích hoạt còi báo động chống trộm đột nhập trái phép vào ban đêm.</li>
        <li><strong>Cảm biến nhiệt độ, độ ẩm:</strong> Tự động kích hoạt bật máy lạnh khi nhiệt độ phòng vượt quá 28 độ C hoặc bật máy hút ẩm khi độ ẩm cao.</li>
      </ul>
    `,
    faq: [
      {
        question: "Pin của các loại cảm biến dùng được bao lâu?",
        answer: "Do sử dụng giao thức truyền tin Zigbee tiết kiệm năng lượng cực tốt, pin cúc áo thông thường của cảm biến có độ bền sử dụng trung bình từ 1 - 2 năm mới cần thay mới."
      },
      {
        question: "Cảm biến chuyển động có phân biệt được thú cưng không?",
        answer: "Một số dòng cảm biến hồng ngoại thông minh tích hợp thuật toán AI giúp nhận biết và bỏ qua các chuyển động của thú cưng dưới 15kg để tránh báo động giả."
      }
    ]
  },

  // === BRANDS ===
  "daikin": {
    content: `
      <p>Daikin là thương hiệu điều hòa không khí hàng đầu thế giới đến từ Nhật Bản với hơn 95 năm hình thành và phát triển. Sản phẩm Daikin luôn dẫn đầu thị trường về chất lượng làm lạnh êm ái, tiết kiệm điện năng vượt trội và độ bền động cơ cực cao.</p>
      <h2>Thế mạnh công nghệ vượt trội của điều hòa Daikin chính hãng</h2>
      <ul>
        <li><strong>Công nghệ Inverter máy nén Swing:</strong> Duy trì nhiệt độ phòng cực kỳ ổn định, vận hành siêu êm ái và giảm thiểu tối đa hóa đơn tiền điện hàng tháng.</li>
        <li><strong>Luồng gió Coanda dễ chịu:</strong> Đẩy luồng gió thổi ngược lên trần nhà rồi mới tỏa nhẹ nhàng xuống xung quanh, mang lại sự mát mẻ dễ chịu, phòng ngừa cảm lạnh cho trẻ nhỏ.</li>
        <li><strong>Màng lọc Enzyme Blue kết hợp PM2.5:</strong> Khử sạch mùi ẩm mốc khó chịu và lọc sạch bụi mịn bảo vệ sức khỏe hệ hô hấp của gia đình bạn.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lạnh Daikin chính hãng bảo hành như thế nào?",
        answer: "Toàn bộ máy lạnh Daikin được bảo hành chính hãng 1 năm cho toàn bộ thân máy và 5 năm cho máy nén (block)."
      },
      {
        question: "Tại sao nên mua Daikin tại Điện máy ELC?",
        answer: "Điện máy ELC là đối tác phân phối chính ngạch của Daikin, cam kết sản phẩm mới nguyên kiện 100%, bảo hành chính hãng đầy đủ kích hoạt điện tử và hỗ trợ thi công kỹ thuật cao."
      }
    ]
  },
  "lg": {
    content: `
      <p>LG là thương hiệu điện tử gia dụng hàng đầu của Hàn Quốc. Dòng máy lạnh LG luôn chinh phục người dùng bởi thiết kế mặt máy hiện đại, tinh tế cùng các tính năng thông minh vượt trội, đặc biệt là công nghệ tiết kiệm điện tối ưu Dual Inverter.</p>
      <h2>Các tính năng nổi bật của điều hòa LG chính hãng</h2>
      <ul>
        <li><strong>Động cơ Dual Inverter Compressor:</strong> Máy nén rotor kép giúp làm lạnh nhanh hơn 40%, vận hành êm và tiết kiệm đến 70% điện năng so với máy lạnh thường.</li>
        <li><strong>Lọc khí lọc bụi mịn PM1.0 hiện đại:</strong> Tích hợp cảm biến đo bụi mịn thông minh và phát ion âm vô hiệu hóa vi khuẩn giúp không khí trong phòng sạch trong lành.</li>
        <li><strong>Điều khiển Wi-Fi LG ThinQ thông minh:</strong> Dễ dàng điều khiển bật/tắt, hẹn giờ và kiểm tra lượng điện năng tiêu thụ của máy lạnh ngay trên điện thoại từ xa.</li>
      </ul>
    `,
    faq: [
      {
        question: "Ứng dụng LG ThinQ trên điện thoại kết nối máy lạnh thế nào?",
        answer: "Bạn chỉ cần kết nối máy lạnh với Wi-Fi nhà mình, mở ứng dụng LG ThinQ trên điện thoại lên và làm theo hướng dẫn kết nối để điều khiển máy lạnh dễ dàng."
      },
      {
        question: "Máy nén Dual Inverter của LG được bảo hành mấy năm?",
        answer: "LG bảo hành chính hãng toàn bộ máy lạnh 2 năm và riêng bộ phận máy nén (block) được bảo hành lên đến 10 năm."
      }
    ]
  },
  "panasonic": {
    content: `
      <p>Panasonic là thương hiệu điện lạnh nổi tiếng lâu đời đến từ Nhật Bản. Các sản phẩm máy lạnh Panasonic nổi tiếng với độ bền cao, hoạt động êm ái, thiết kế sang trọng và đặc biệt là công nghệ lọc không khí Nanoe-X độc quyền bảo vệ sức khỏe tối đa.</p>
      <h2>Những ưu điểm nổi bật của điều hòa Panasonic</h2>
      <ul>
        <li><strong>Công nghệ lọc khí Nanoe-X:</strong> Giải phóng hàng tỷ gốc OH tự nhiên giúp tiêu diệt vi khuẩn, virus, khử mùi hôi khó chịu và giữ ẩm cho da, tóc không bị khô khi nằm điều hòa lâu.</li>
        <li><strong>Công nghệ Inverter và ECO tích hợp A.I:</strong> Tự động học hỏi nhiệt độ phòng và điều chỉnh công suất làm mát tối ưu, tiết kiệm điện năng thông minh.</li>
        <li><strong>Làm lạnh nhanh iAUTO-X:</strong> Tăng tốc độ quạt dàn lạnh siêu nhanh kết hợp cánh gió Aerowings đưa phòng đạt nhiệt độ dễ chịu nhanh hơn 35%.</li>
      </ul>
    `,
    faq: [
      {
        question: "Tính năng lọc khí Nanoe-X của Panasonic hoạt động độc lập được không?",
        answer: "Được. Bạn có thể bật chế độ lọc khí Nanoe-X độc lập khi máy lạnh tắt chế độ làm lạnh, điện năng tiêu thụ lúc này cực thấp chỉ khoảng 25W/giờ."
      },
      {
        question: "Máy lạnh Panasonic bảo hành mấy năm?",
        answer: "Panasonic bảo hành toàn bộ máy trong vòng 1 năm và máy nén block được bảo hành chính hãng lên tới 7 năm."
      }
    ]
  },
  "samsung": {
    content: `
      <p>Samsung luôn tiên phong mang những cải tiến công nghệ thông minh vào cuộc sống. Với mảng điều hòa, dòng sản phẩm Samsung WindFree là bước đột phá lớn với công nghệ làm lạnh không gió buốt thổi trực tiếp, mang lại sự mát lành dịu nhẹ bảo vệ sức khỏe gia đình tốt nhất.</p>
      <h2>Những tính năng vượt trội trên máy lạnh Samsung</h2>
      <ul>
        <li><strong>Làm lạnh không gió buốt WindFree:</strong> Luồng khí mát được phả nhẹ nhàng qua 23.000 lỗ siêu nhỏ trên bề mặt máy, tạo độ mát dịu nhẹ mà không gây lạnh buốt da do luồng gió thổi trực tiếp.</li>
        <li><strong>Động cơ Digital Inverter Boost:</strong> Tiết kiệm điện năng vượt trội lên đến 73% và vận hành cực kỳ êm ái, bền bỉ.</li>
        <li><strong>Bộ lọc PM1.0 kháng khuẩn tốt:</strong> Giữ lại các hạt bụi siêu mịn và lọc sạch vi khuẩn có hại trong không khí.</li>
      </ul>
    `,
    faq: [
      {
        question: "Chế độ WindFree hoạt động như thế nào?",
        answer: "Ban đầu máy sẽ làm lạnh nhanh bình thường để hạ nhiệt độ phòng. Sau khi đạt nhiệt độ cài đặt, cánh gió sẽ khép lại và khí mát phả dịu qua 23.000 lỗ li ti giúp duy trì độ mát nhẹ nhàng."
      },
      {
        question: "Máy nén Inverter Samsung bảo hành bao lâu?",
        answer: "Samsung áp dụng chế độ bảo hành 2 năm cho toàn máy và bảo hành lên tới 10 năm cho máy nén Digital Inverter."
      }
    ]
  },
  "gree": {
    content: `
      <p>Gree là tập đoàn sản xuất điều hòa không khí lớn trên thế giới. Sản phẩm máy lạnh Gree được khách hàng ưa chuộng nhờ vào mức giá cực kỳ cạnh tranh, khả năng làm lạnh bền bỉ, trâu bò và chính sách bảo hành dài hạn của hãng.</p>
      <h2>Ưu điểm của điều hòa Gree chính hãng</h2>
      <ul>
        <li><strong>Làm lạnh Real Cool thổi gió xa:</strong> Luồng gió mát lạnh sâu, tự nhiên và dễ chịu, không làm khô da.</li>
        <li><strong>Công nghệ tiết kiệm điện G10 Inverter:</strong> Giúp máy nén hoạt động ở tần số cực thấp để duy trì độ lạnh ổn định và tiết kiệm điện năng tiêu thụ đến 60%.</li>
        <li><strong>Cảm biến nhiệt độ thông minh I-Feel:</strong> Tự động đo nhiệt độ tại vị trí đặt remote để điều chỉnh hướng gió thổi làm mát chính xác vị trí người dùng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Điều hòa Gree bảo hành chính hãng mấy năm?",
        answer: "Gree có chính sách bảo hành cực kỳ tốt: bảo hành toàn bộ máy trong 3 năm và bảo hành máy nén block lên tới 5 năm."
      },
      {
        question: "Máy lạnh Gree dùng có êm không?",
        answer: "Rất êm. Các dòng máy Gree hiện nay thiết kế cánh quạt dàn lạnh tối ưu giảm rung chấn nên tiếng ồn hoạt động dàn lạnh cực nhỏ dưới 20dB."
      }
    ]
  },
  "mitsubishi": {
    content: `
      <p>Mitsubishi (bao gồm Mitsubishi Heavy và Mitsubishi Electric) là thương hiệu điện lạnh cao cấp hàng đầu của Nhật Bản. Máy lạnh Mitsubishi nổi tiếng thế giới về độ bền bỉ cơ học 'nồi đồng cối đá', máy chạy êm ru và làm lạnh nhanh sâu vô cùng sảng khoái.</p>
      <h2>Thế mạnh của điều hòa Mitsubishi chính hãng</h2>
      <ul>
        <li><strong>Độ bền bỉ đáng kinh ngạc:</strong> Thiết kế dàn tản nhiệt ống đồng dày dặn, dàn nóng phủ lớp chống ăn mòn chống muối biển và mưa axit cực tốt, phù hợp lắp đặt mọi địa hình khắc nghiệt.</li>
        <li><strong>Công nghệ Inverter PAM/PAM Inverter:</strong> Tối ưu hóa hiệu năng nguồn điện cấp vào máy nén, tăng khả năng làm mát và giảm tiêu hao điện năng tối đa.</li>
        <li><strong>Làm lạnh 3D Auto thông minh:</strong> Tự động đảo cánh gió đa hướng ngang dọc nhịp nhàng đưa luồng khí mát len lỏi đến từng góc phòng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Điều hòa Mitsubishi Heavy bảo hành bao lâu?",
        answer: "Sản phẩm được bảo hành chính hãng 2 năm cho toàn bộ máy và 5 năm cho máy nén block."
      },
      {
        question: "Máy lạnh Mitsubishi Electric khác gì Mitsubishi Heavy?",
        answer: "Cả hai thương hiệu đều thuộc tập đoàn Mitsubishi nhưng hoạt động độc lập. Cả hai đều có chất lượng máy cực kỳ bền bỉ và làm lạnh sâu, Mitsubishi Electric chú trọng nhiều thiết kế gia dụng tinh tế, Heavy thiên về hiệu năng thương mại mạnh mẽ."
      }
    ]
  },
  "midea": {
    content: `
      <p>Midea là thương hiệu điện gia dụng lớn hàng đầu thế giới với mức giá bán cực kỳ dễ chịu phù hợp túi tiền của số đông người tiêu dùng Việt Nam. Máy lạnh Midea sở hữu thiết kế trang nhã, làm lạnh nhanh và tích hợp công nghệ tiết kiệm điện Inverter thế hệ mới.</p>
      <h2>Ưu điểm của máy lạnh Midea giá rẻ chính hãng</h2>
      <ul>
        <li><strong>Mức giá đầu tư ban đầu cực rẻ:</strong> Phù hợp tuyệt đối cho các bạn trẻ thuê phòng, căn hộ nhỏ, nhà trọ sinh viên hay các dự án văn phòng tiết kiệm ngân sách.</li>
        <li><strong>Làm lạnh nhanh Boost:</strong> Chỉ cần một nút nhấn máy sẽ tăng công suất quạt dàn lạnh lên mức tối đa giúp phòng mát lạnh nhanh chóng.</li>
        <li><strong>Màng lọc bụi Dual Filtration:</strong> Loại bỏ các loại bụi thô và lông thú cưng lơ lửng trong phòng giữ cho không khí luôn thông thoáng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lạnh Midea bảo hành chính hãng bao lâu?",
        answer: "Midea bảo hành chính hãng toàn bộ máy lạnh trong 2 năm và bảo hành máy nén trong vòng 5 năm."
      },
      {
        question: "Máy lạnh Midea giá rẻ dùng có bền không?",
        answer: "Nếu được lắp đặt đúng kỹ thuật và vệ sinh định kỳ 3-4 tháng/lần, máy lạnh Midea hoạt động rất ổn định và bền bỉ trong nhiều năm."
      }
    ]
  },
  "carrier": {
    content: `
      <p>Carrier là thương hiệu điều hòa không khí lâu đời của Mỹ được sáng lập bởi chính Willis Carrier - người phát minh ra máy điều hòa không khí đầu tiên trên thế giới. Dòng máy Carrier nổi bật với hiệu suất làm lạnh công nghiệp mạnh mẽ, bền bỉ và chất lượng cơ học chuẩn Mỹ.</p>
      <h2>Các tính năng nổi trội của máy lạnh Carrier</h2>
      <ul>
        <li><strong>Vận hành bền bỉ tần suất cao:</strong> Chuyên trị các công trình yêu cầu hệ thống điều hòa chạy liên tục ổn định như văn phòng, nhà xưởng, rạp chiếu phim, tòa nhà thương mại.</li>
        <li><strong>Tiết kiệm năng lượng chuẩn quốc tế:</strong> Các dòng máy Carrier tích hợp công nghệ tiết kiệm điện thông minh đạt chuẩn đánh giá hiệu năng cao của Mỹ và châu Âu.</li>
        <li><strong>Thiết kế dàn nóng chắc chắn:</strong> Vỏ dàn nóng bằng tôn mạ kẽm dày dặn, chịu được thời tiết khắc nghiệt ngoài trời rất tốt.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lạnh Carrier được bảo hành mấy năm?",
        answer: "Carrier bảo hành chính hãng toàn bộ máy lạnh 2 năm để đảm bảo quyền lợi bảo trì tốt nhất cho khách hàng."
      },
      {
        question: "Thương hiệu Carrier phù hợp cho những công trình nào?",
        answer: "Thích hợp nhất cho hệ thống điều hòa trung tâm VRF, máy lạnh giấu trần ống gió văn phòng, nhà hàng và biệt thự cao cấp."
      }
    ]
  },
  "hagisu": {
    content: `
      <p>Hagisu là thương hiệu điều hòa không khí chất lượng cao nổi tiếng với dòng sản phẩm máy lạnh thương mại, dân dụng công nghệ tiên tiến và dịch vụ khách hàng tận tâm. Điện máy ELC là nhà phân phối chính thức các dòng sản phẩm của Hagisu tại Việt Nam.</p>
      <h2>Đặc điểm nổi bật của máy lạnh Hagisu chính hãng</h2>
      <ul>
        <li><strong>Công nghệ làm lạnh sâu nhanh chóng:</strong> Thiết kế dàn bay hơi diện tích lớn giúp tăng tốc độ làm mát không khí phòng.</li>
        <li><strong>Màng lọc khí đa tầng diệt khuẩn:</strong> Tích hợp màng lọc chất lượng tốt giúp khử mùi ẩm mốc và diệt khuẩn tối ưu.</li>
        <li><strong>Chính sách hậu mãi tốt:</strong> Dịch vụ hỗ trợ kỹ thuật bảo dưỡng và sửa chữa nhanh chóng, chu đáo.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lạnh Hagisu bảo hành chính hãng bao lâu?",
        answer: "Sản phẩm được bảo hành toàn bộ máy chính hãng trong vòng 2 năm."
      },
      {
        question: "Nên lắp máy lạnh Hagisu cho không gian nào?",
        answer: "Phù hợp cho các không gian phòng khách gia đình, phòng ngủ căn hộ chung cư và văn phòng làm việc quy mô nhỏ."
      }
    ]
  },
  "acis": {
    content: `
      <p>Acis là thương hiệu công nghệ Smart Home hàng đầu của Việt Nam. Hệ thống nhà thông minh Acis nổi tiếng với giải pháp Easy Control không dây tự phát triển, giúp biến mọi ngôi nhà truyền thống thành nhà thông minh cao cấp dễ dàng mà không làm ảnh hưởng đến cấu trúc tường cũ.</p>
      <h2>Lợi thế vượt trội của giải pháp nhà thông minh Acis</h2>
      <ul>
        <li><strong>Công nghệ không dây độc quyền:</strong> Sử dụng sóng vô tuyến tần số riêng ổn định, xuyên tường cực tốt và không sợ bị nhiễu như Wi-Fi.</li>
        <li><strong>Sản xuất và thiết kế tại Việt Nam:</strong> Giao diện ứng dụng hoàn toàn bằng tiếng Việt thân thiện, dễ sử dụng cho cả người già và trẻ nhỏ.</li>
        <li><strong>Mặt kính cảm ứng sang trọng:</strong> Công tắc Acis thiết kế mặt kính cường lực viền nhôm tinh xảo, tăng tính sang trọng cho nội thất nhà bạn.</li>
      </ul>
    `,
    faq: [
      {
        question: "Thiết bị nhà thông minh Acis được bảo hành bao lâu?",
        answer: "Acis áp dụng chính sách bảo hành chính hãng vượt trội lên đến 3 - 5 năm cho các dòng sản phẩm của mình."
      },
      {
        question: "Nhà thông minh Acis có dễ lắp đặt không?",
        answer: "Rất dễ dàng. Kỹ thuật viên chỉ cần thay thế các công tắc cơ cũ bằng công tắc cảm ứng Acis vào đế âm tường cũ mà không cần đi lại đường dây điện."
      }
    ]
  },
  "menred": {
    content: `
      <p>Menred là thương hiệu công nghệ kiểm soát khí hậu và giải pháp gió tươi thông minh nổi tiếng của Đức. Tại Việt Nam, Menred dẫn đầu trong mảng cung cấp hệ thống máy cấp khí tươi, máy lọc không khí trung tâm thu hồi nhiệt ERV và các giải pháp điều khiển sưởi sàn, điều hòa thông minh.</p>
      <h2>Ưu điểm đẳng cấp của hệ thống cấp khí tươi Menred</h2>
      <ul>
        <li><strong>Động cơ quạt EC siêu tiết kiệm điện:</strong> Vận hành bền bỉ liên tục 24/7 với lượng điện năng cực thấp và tiếng ồn hoạt động dưới mức tai người nghe thấy.</li>
        <li><strong>Màng lọc HEPA H13 tiêu chuẩn y tế:</strong> Lọc sạch bụi mịn PM2.5, các chất gây dị ứng và vi sinh vật gây hại trước khi đưa khí sạch vào nhà.</li>
        <li><strong>Bộ trao đổi nhiệt hiệu suất cao:</strong> Hiệu suất hồi nhiệt lên tới 75-80%, giữ nhiệt lạnh trong phòng không bị thất thoát ra ngoài.</li>
      </ul>
    `,
    faq: [
      {
        question: "Tại sao nên chọn hệ thống gió tươi Menred cho biệt thự?",
        answer: "Hệ thống Menred đảm bảo cung cấp luồng khí tươi giàu oxy liên tục đến từng phòng ngủ, phòng khách giúp người ở luôn tỉnh táo khỏe mạnh, không bị khô da khi bật máy lạnh."
      },
      {
        question: "Hệ thống điều khiển trung tâm Menred kết nối điều hòa được không?",
        answer: "Được. Bảng điều khiển cảm ứng của Menred hỗ trợ kết nối đồng bộ điều hòa trung tâm VRV/VRF để quản lý nhiệt độ thông minh."
      }
    ]
  },
  "toshiba": {
    content: `
      <p>Toshiba là thương hiệu điện tử gia dụng kỳ cựu của Nhật Bản. Các sản phẩm điều hòa Toshiba luôn là biểu tượng của chất lượng bền bỉ, công nghệ làm lạnh nhanh chóng và đặc biệt là hệ thống lọc bụi mịn kháng khuẩn độc quyền Toshiba IAQ.</p>
      <h2>Ưu điểm nổi bật của máy lạnh Toshiba chính hãng</h2>
      <ul>
        <li><strong>Công nghệ Hybrid Inverter:</strong> Kết hợp giữa 2 module kiểm soát dòng điện khác nhau giúp điều chỉnh công suất làm mát mượt mà, tối ưu hóa lượng điện tiêu thụ lên đến 60%.</li>
        <li><strong>Bộ lọc Toshiba IAQ kháng khuẩn tốt:</strong> Tích hợp Leuconostoc enzyme và tinh thể bạc (Ag+) kháng khuẩn giúp tiêu diệt vi khuẩn, virus và ngăn chặn nấm mốc phát triển.</li>
        <li><strong>Chống bám bẩn Magic Coil:</strong> Lớp phủ đặc biệt trên dàn lạnh ngăn ngừa bụi bẩn bám dính, giúp dàn lạnh luôn sạch sẽ, tăng lưu lượng gió thổi ra.</li>
      </ul>
    `,
    faq: [
      {
        question: "Công nghệ Magic Coil hoạt động thế nào?",
        answer: "Lá nhôm dàn lạnh được phủ lớp chống bám bẩn. Khi máy hoạt động, nước ngưng tụ sẽ tự động cuốn trôi sạch các vết bụi bẩn bám trên dàn lạnh ra ngoài theo đường ống xả."
      },
      {
        question: "Máy lạnh Toshiba chính hãng bảo hành bao lâu?",
        answer: "Toshiba bảo hành chính hãng toàn bộ máy lạnh trong vòng 2 năm."
      }
    ]
  }
};

// Generates the final SEO data mapping JSON file
function build() {
  console.log("Generating final SEO and FAQ data...");
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(FINAL_SEO_DATA, null, 2), "utf-8");
  console.log(`Successfully generated final SEO data at: ${OUTPUT_FILE}`);
}

build();
